import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from collections import deque

FISH_DIR = 'public/fish'

def clean_sprite_perfect(image_path, role):
    im = Image.open(image_path).convert('RGBA')
    w, h = im.size
    arr = np.array(im).astype(np.float32)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]

    filename = os.path.basename(image_path)
    is_repa4 = 'repa_stage4' in filename
    is_repa5 = 'repa_stage5' in filename
    is_candut5 = 'candut_stage5' in filename

    # 1. Clear known external crop/box artifacts
    if is_repa4:
        alpha[341:, :] = 0
    if is_repa5:
        alpha[:, 452:] = 0
        alpha[410:, 130:305] = 0
        alpha[438:, :] = 0
    if is_candut5:
        alpha[390:445, 460:] = 0
        alpha[-15:, 460:] = 0

    # Eliminate faint low-alpha noise
    alpha[alpha < 18] = 0

    # 2. Identify the eye region to protect black pupil and sparkling reflections
    eye_mask = np.zeros((h, w), dtype=bool)
    x_min, x_max = int(w * 0.62), int(w * 0.90)
    y_min, y_max = int(h * 0.30), int(h * 0.70)
    eye_mask[y_min:y_max, x_min:x_max] = True

    # 3. Flood-fill from borders to clear any connected black background remnants
    bg_seed = (alpha == 0)
    dark_thresh = 65
    bg_seed[0, :] |= (rgb[0, :, :].mean(axis=1) < dark_thresh)
    bg_seed[-1, :] |= (rgb[-1, :, :].mean(axis=1) < dark_thresh)
    bg_seed[:, 0] |= (rgb[:, 0, :].mean(axis=1) < dark_thresh)
    bg_seed[:, -1] |= (rgb[:, -1, :].mean(axis=1) < dark_thresh)

    bg_visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for y in range(h):
        for x in [0, w - 1]:
            if bg_seed[y, x] and not bg_visited[y, x]:
                bg_visited[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in [0, h - 1]:
            if bg_seed[y, x] and not bg_visited[y, x]:
                bg_visited[y, x] = True
                q.append((y, x))

    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not bg_visited[ny, nx]:
                is_dark = (rgb[ny, nx].mean() < 60) and not eye_mask[ny, nx]
                is_trans = (alpha[ny, nx] < 120)
                if is_trans or is_dark:
                    bg_visited[ny, nx] = True
                    q.append((ny, nx))

    alpha[bg_visited] = 0

    # 4. Remove dark pockets trapped between fins outside the eye
    dark_opaque = (alpha > 0) & (rgb.mean(axis=2) < 55) & (~eye_mask)
    if np.any(dark_opaque):
        visited_comp = np.zeros((h, w), dtype=bool)
        for y in range(h):
            for x in range(w):
                if dark_opaque[y, x] and not visited_comp[y, x]:
                    comp = []
                    cq = [(y, x)]
                    visited_comp[y, x] = True
                    while cq:
                        py, px = cq.pop()
                        comp.append((py, px))
                        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                            my, mx = py + dy, px + dx
                            if 0 <= my < h and 0 <= mx < w and dark_opaque[my, mx] and not visited_comp[my, mx]:
                                visited_comp[my, mx] = True
                                cq.append((my, mx))
                    c_ys = [p[0] for p in comp]
                    c_xs = [p[1] for p in comp]
                    mean_x = np.mean(c_xs)
                    if mean_x < w * 0.62 or np.mean(c_ys) < h * 0.3 or np.mean(c_ys) > h * 0.72:
                        for py, px in comp:
                            alpha[py, px] = 0

    # 5. KEEP ONLY THE LARGEST CONNECTED COMPONENT (the fish)
    # This automatically destroys all isolated specks, stray border lines, and floating debris
    solid = alpha > 0
    visited_island = np.zeros((h, w), dtype=bool)
    max_island = []
    for y in range(h):
        for x in range(w):
            if solid[y, x] and not visited_island[y, x]:
                island = []
                iq = [(y, x)]
                visited_island[y, x] = True
                while iq:
                    py, px = iq.pop()
                    island.append((py, px))
                    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        my, mx = py + dy, px + dx
                        if 0 <= my < h and 0 <= mx < w and solid[my, mx] and not visited_island[my, mx]:
                            visited_island[my, mx] = True
                            iq.append((my, mx))
                if len(island) > len(max_island):
                    max_island = island

    # Mask only the main fish
    fish_mask = np.zeros((h, w), dtype=bool)
    for py, px in max_island:
        fish_mask[py, px] = True
    alpha[~fish_mask] = 0

    # 6. LOCAL COLOR BLEED (Normalized Convolution Inpainting)
    # Candut fish body is >= 85, Repa is >= 95
    fish_min_bright = 85 if role == 'candut' else 95
    interior_mask = (alpha > 220) & ((rgb.mean(axis=2) >= fish_min_bright) | eye_mask)

    weight_img = Image.fromarray((interior_mask * 255).astype(np.uint8), mode='L')
    color_img = Image.fromarray((rgb * interior_mask[:, :, None]).astype(np.uint8), mode='RGB')

    # Local box blur with radius 5
    blur_weight = np.array(weight_img.filter(ImageFilter.BoxBlur(5))).astype(np.float32) / 255.0
    blur_color = np.array(color_img.filter(ImageFilter.BoxBlur(5))).astype(np.float32)

    local_infill = blur_color / np.clip(blur_weight[:, :, None], 0.001, 1.0)
    local_infill = np.clip(local_infill, 0, 255)

    # Rim pixels that were contaminated by black matte
    padded_alpha = np.pad(alpha > 0, 1, mode='constant', constant_values=False)
    has_trans_neighbor = (
        (~padded_alpha[:-2, 1:-1]) | (~padded_alpha[2:, 1:-1]) |
        (~padded_alpha[1:-1, :-2]) | (~padded_alpha[1:-1, 2:])
    )
    is_outer_rim = (alpha > 0) & (
        (alpha < 240) |
        (has_trans_neighbor & (rgb.mean(axis=2) < fish_min_bright) & (~eye_mask))
    )

    final_rgb = rgb.copy()
    rim_needs_color = is_outer_rim & ((rgb.mean(axis=2) < fish_min_bright) | (alpha < 180)) & (~eye_mask)
    final_rgb[rim_needs_color] = local_infill[rim_needs_color]

    # Smooth alpha slightly to eliminate jagged pixels and clip outer 0.75px dark rim
    alpha_pil = Image.fromarray(alpha.astype(np.uint8), mode='L')
    alpha_eroded = alpha_pil.filter(ImageFilter.MinFilter(3))
    arr_orig_a = np.array(alpha_pil).astype(float)
    arr_ero_a = np.array(alpha_eroded).astype(float)

    final_alpha = np.clip(arr_orig_a * 0.35 + arr_ero_a * 0.65, 0, 255)
    final_alpha[final_alpha < 20] = 0

    result = np.dstack([final_rgb, final_alpha]).astype(np.uint8)
    return Image.fromarray(result, mode='RGBA')

def make_chibi_baby_sprite(clean_im, role):
    w, h = clean_im.size
    arr = np.array(clean_im).astype(np.float32)

    eye_x, eye_y = (int(w * 0.76), int(h * 0.50))

    # Chubby baby fry coordinate remap:
    y_coords, x_coords = np.mgrid[0:h, 0:w]
    bc_x, bc_y = w * 0.52, h * 0.54
    nx = (x_coords - bc_x) / (w * 0.5)
    ny = (y_coords - bc_y) / (h * 0.5)

    warp_x = x_coords.copy().astype(float)
    warp_y = y_coords.copy().astype(float)

    # Shorter, rounder baby tail and compact baby silhouette
    warp_x += np.clip(-nx, 0, 1) ** 1.3 * 18.0

    # Chubby baby tummy (round body)
    dist_body = np.hypot(nx, ny)
    bulge = np.exp(-dist_body ** 2 / 0.45)
    warp_x -= nx * bulge * 7.0
    warp_y -= ny * bulge * 7.0

    # Baby head & eye enlargement (chibi cranium)
    head_dist = np.hypot((x_coords - eye_x) / 50.0, (y_coords - eye_y) / 50.0)
    head_bulge = np.exp(-head_dist ** 2 / 1.2) * 6.0
    warp_x -= (x_coords - eye_x) / 50.0 * head_bulge
    warp_y -= (y_coords - eye_y) / 50.0 * head_bulge

    warp_x = np.clip(warp_x, 0, w - 1)
    warp_y = np.clip(warp_y, 0, h - 1)

    x0 = np.floor(warp_x).astype(int)
    x1 = np.clip(x0 + 1, 0, w - 1)
    y0 = np.floor(warp_y).astype(int)
    y1 = np.clip(y0 + 1, 0, h - 1)
    wx = warp_x - x0
    wy = warp_y - y0

    warped_arr = np.zeros_like(arr)
    for c in range(4):
        c00 = arr[y0, x0, c]
        c01 = arr[y0, x1, c]
        c10 = arr[y1, x0, c]
        c11 = arr[y1, x1, c]
        warped_arr[:, :, c] = (
            c00 * (1 - wx) * (1 - wy) +
            c01 * wx * (1 - wy) +
            c10 * (1 - wx) * wy +
            c11 * wx * wy
        )
    warped_im = Image.fromarray(warped_arr.astype(np.uint8), mode='RGBA')

    # Smooth baby skin on flank (eliminates mature scale bumpiness)
    smooth_im = warped_im.filter(ImageFilter.MedianFilter(7))
    flank_mask = Image.new('L', (w, h), 0)
    draw_mask = ImageDraw.Draw(flank_mask)
    draw_mask.ellipse([int(w * 0.28), int(h * 0.28), int(w * 0.65), int(h * 0.78)], fill=210)
    flank_mask = flank_mask.filter(ImageFilter.GaussianBlur(12))
    warped_im = Image.composite(smooth_im, warped_im, flank_mask)

    # Soft, adorable baby rosy blush on cheek
    blush_overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    blush_draw = ImageDraw.Draw(blush_overlay)
    cheek_x = int(w * 0.77)
    cheek_y = int(h * 0.62)
    blush_color = (255, 140, 160, 130) if role == 'candut' else (255, 110, 145, 150)
    for r in range(16, 0, -2):
        alpha_step = int(blush_color[3] * (1.0 - r / 16.0))
        c = (blush_color[0], blush_color[1], blush_color[2], alpha_step)
        blush_draw.ellipse([cheek_x - r * 1.3, cheek_y - r * 0.8, cheek_x + r * 1.3, cheek_y + r * 0.8], fill=c)
    warped_im = Image.alpha_composite(warped_im, blush_overlay)

    # Sparkling baby eye catchlights
    sparkle_overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    sparkle_draw = ImageDraw.Draw(sparkle_overlay)
    sp_x = int(w * 0.785)
    sp_y = int(h * 0.52)
    sparkle_draw.ellipse([sp_x - 3, sp_y - 2, sp_x + 3, sp_y + 2], fill=(255, 255, 255, 240))
    sp2_x = int(w * 0.755)
    sp2_y = int(h * 0.44)
    sparkle_draw.ellipse([sp2_x - 1, sp2_y - 1, sp2_x + 2, sp2_y + 2], fill=(255, 255, 255, 220))
    warped_im = Image.alpha_composite(warped_im, sparkle_overlay)

    return warped_im

def main():
    print('Processing all sprites...')
    sprites = {}
    for role in ['candut', 'repa']:
        for stage in range(1, 6):
            orig_path = os.path.join(FISH_DIR, f'{role}_stage{stage}.png')
            key = f'{role}_stage{stage}'
            cleaned = clean_sprite_perfect(orig_path, role)
            sprites[key] = cleaned

    # Make Stage 1 distinctly baby
    for role in ['candut', 'repa']:
        baby = make_chibi_baby_sprite(sprites[f'{role}_stage1'], role)
        sprites[f'{role}_stage1'] = baby

    # Save all 10 fish sprites
    for key, img in sprites.items():
        out_path = os.path.join(FISH_DIR, f'{key}.png')
        img.save(out_path, 'PNG', optimize=True)
        print(f'Saved {out_path}')

    # Generate full 5-stage preview grid
    grid = Image.new('RGB', (1500, 640), (240, 245, 250))
    for col, s in enumerate(range(1, 6)):
        c_img = Image.open(os.path.join(FISH_DIR, f'candut_stage{s}.png'))
        r_img = Image.open(os.path.join(FISH_DIR, f'repa_stage{s}.png'))
        c_img.thumbnail((260, 260), Image.Resampling.LANCZOS)
        r_img.thumbnail((260, 260), Image.Resampling.LANCZOS)

        cx = col * 300 + (300 - c_img.width) // 2
        cy = 20 + (260 - c_img.height) // 2
        grid.paste(c_img, (cx, cy), c_img)

        rx = col * 300 + (300 - r_img.width) // 2
        ry = 340 + (260 - r_img.height) // 2
        grid.paste(r_img, (rx, ry), r_img)

    grid.save('public/fish_preview_cleaned.png')
    print('Updated public/fish_preview_cleaned.png successfully')

if __name__ == '__main__':
    main()


import os
import sys
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import numpy as np
from collections import deque

ORIG_DIR = r"C:\Users\acer\.gemini\antigravity\brain\9d22dcdd-d124-4094-9cc2-f352ecbcdd94\scratch\orig_sprites"
PUBLIC_DIR = r"d:\aqua\public\fish"
os.makedirs(PUBLIC_DIR, exist_ok=True)

def make_chibi_baby_sprite(im, role):
    w, h = im.size
    arr = np.array(im).astype(np.float32)

    eye_x, eye_y = (int(w * 0.76), int(h * 0.50))

    y_coords, x_coords = np.mgrid[0:h, 0:w]
    bc_x, bc_y = w * 0.52, h * 0.54
    nx = (x_coords - bc_x) / (w * 0.5)
    ny = (y_coords - bc_y) / (h * 0.5)

    warp_x = x_coords.copy().astype(float)
    warp_y = y_coords.copy().astype(float)

    # Shorter, rounder baby tail and compact baby silhouette
    warp_x += np.clip(-nx, 0, 1) ** 1.3 * 18.0

    # Chubby baby tummy
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

    # Smooth baby skin on flank
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
    sparkle_draw.ellipse([sp2_x - 1.5, sp2_y - 1.5, sp2_x + 1.5, sp2_y + 1.5], fill=(255, 255, 255, 230))
    warped_im = Image.alpha_composite(warped_im, sparkle_overlay)

    baby_arr = np.array(warped_im)
    baby_a = baby_arr[:, :, 3]
    baby_arr[baby_a > 120, 3] = 255
    baby_arr[(baby_a > 0) & (baby_a <= 120), 3] = np.clip(baby_a[(baby_a > 0) & (baby_a <= 120)] * 1.5, 0, 255).astype(np.uint8)

    return Image.fromarray(baby_arr, mode='RGBA')

def process_single_fish(fname, role, stage):
    in_path = os.path.join(ORIG_DIR, fname)
    im = Image.open(in_path).convert("RGBA")
    w, h = im.size
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(float)
    alpha = arr[:, :, 3].astype(float)

    # 1. Clean raw image corner artifacts at extreme boundaries
    if fname == 'repa_stage4.png':
        alpha[340:, :] = 0
        alpha[:, :3] = 0
    elif fname == 'repa_stage5.png':
        alpha[:, 450:] = 0
        alpha[410:, 130:305] = 0
        alpha[435:, :] = 0
    elif fname == 'candut_stage5.png':
        alpha[375:445, 460:] = 0
        alpha[-15:, 460:] = 0
        alpha[-3:, :] = 0
    elif fname == 'candut_stage4.png':
        alpha[-3:, :] = 0
    elif fname == 'repa_stage2.png':
        alpha[:, -4:] = 0
    elif fname == 'repa_stage3.png':
        alpha[:, :4] = 0

    # 2. Flood fill background from 4 outer boundaries
    bg_visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for y in range(h):
        for x in [0, w - 1]:
            if alpha[y, x] < 60:
                bg_visited[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in [0, h - 1]:
            if not bg_visited[y, x] and alpha[y, x] < 60:
                bg_visited[y, x] = True
                q.append((y, x))

    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not bg_visited[ny, nx]:
                if alpha[ny, nx] < 40 or (alpha[ny, nx] < 120 and np.mean(rgb[ny, nx]) < 35):
                    bg_visited[ny, nx] = True
                    q.append((ny, nx))

    fish_envelope = ~bg_visited

    # 3. Fill interior holes in envelope so body is 100% solid
    env_img = Image.fromarray((fish_envelope * 255).astype(np.uint8), mode='L')
    inv_img = Image.eval(env_img, lambda a: 255 if a == 0 else 0)
    inv_arr = np.array(inv_img)
    bg_fill = np.zeros((h, w), dtype=bool)
    fq = deque([(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)])
    for y, x in fq: bg_fill[y, x] = True
    while fq:
        cy, cx = fq.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not bg_fill[ny, nx] and inv_arr[ny, nx] == 255:
                bg_fill[ny, nx] = True
                fq.append((ny, nx))
    solid_envelope = ~bg_fill

    # 4. Eye protection mask (black pupil)
    eye_mask = np.zeros((h, w), dtype=bool)
    eye_mask[int(h * 0.35):int(h * 0.65), int(w * 0.65):int(w * 0.88)] = True

    # 5. Erode outer black fringe shell by 1.5 - 2 pixels
    env_pil = Image.fromarray((solid_envelope * 255).astype(np.uint8), mode='L')
    eroded_shell = env_pil.filter(ImageFilter.MinFilter(3))
    eroded_shell = eroded_shell.filter(ImageFilter.MinFilter(3))
    arr_eroded = np.array(eroded_shell) > 128

    # Clean interior color extraction
    min_clean_b = 75 if role == 'candut' else 85
    brightness = np.mean(rgb, axis=2)
    clean_color_mask = arr_eroded & (brightness >= min_clean_b)

    # Inpaint fringe zone outward using normalized convolution
    clean_weight = clean_color_mask.astype(float)
    clean_rgb = rgb * clean_weight[:, :, None]

    w_pil = Image.fromarray((clean_weight * 255).astype(np.uint8), mode='L').filter(ImageFilter.GaussianBlur(8))
    c_pil = Image.fromarray(clean_rgb.astype(np.uint8), mode='RGB').filter(ImageFilter.GaussianBlur(8))
    bw = np.array(w_pil).astype(float) / 255.0
    bc = np.array(c_pil).astype(float)
    infill_rgb = bc / np.clip(bw[:, :, None], 0.0001, 1.0)
    infill_rgb = np.clip(infill_rgb, 0, 255)

    # Replace dark fringe pixels
    is_fringe = solid_envelope & (brightness < min_clean_b) & (~eye_mask)
    clean_rgb_map = rgb.copy()
    clean_rgb_map[is_fringe] = infill_rgb[is_fringe]

    # Reconstruct silky smooth contour
    eroded_smooth = np.array(eroded_shell.filter(ImageFilter.GaussianBlur(0.8))).astype(float) / 255.0
    smooth_alpha = np.clip((eroded_smooth - 0.15) / (0.75 - 0.15), 0.0, 1.0) * 255.0
    smooth_alpha[smooth_alpha > 210] = 255.0
    smooth_alpha[smooth_alpha < 15] = 0.0
    smooth_alpha[~solid_envelope] = 0.0

    base_cleaned = Image.fromarray(np.dstack([clean_rgb_map, smooth_alpha]).astype(np.uint8), mode='RGBA')

    # If stage 1, apply adorable chibi fry transformations
    if stage == 1:
        base_cleaned = make_chibi_baby_sprite(base_cleaned, role)

    # 6. HD 2X UPSCALE (LANCZOS RESAMPLING)
    hd_w, hd_h = w * 2, h * 2
    hd_im = base_cleaned.resize((hd_w, hd_h), resample=Image.Resampling.LANCZOS)

    # 7. HD CRISP UNSHARP MASKING & COLOR POLISH
    hd_arr = np.array(hd_im).astype(float)
    hd_rgb = hd_arr[:, :, :3]
    hd_alpha = hd_arr[:, :, 3]

    hd_rgb_pil = Image.fromarray(hd_rgb.astype(np.uint8), mode='RGB')
    hd_sharpened = hd_rgb_pil.filter(ImageFilter.UnsharpMask(radius=1.6, percent=125, threshold=1))
    
    enhancer = ImageEnhance.Color(hd_sharpened)
    hd_vibrant = enhancer.enhance(1.05)
    contrast_enhancer = ImageEnhance.Contrast(hd_vibrant)
    hd_crisp_rgb = np.array(contrast_enhancer.enhance(1.02)).astype(float)

    # HD Alpha re-tightening
    hd_a_pil = Image.fromarray(hd_alpha.astype(np.uint8), mode='L')
    hd_a_smooth = np.array(hd_a_pil.filter(ImageFilter.GaussianBlur(0.8))).astype(float)
    hd_final_alpha = np.clip((hd_a_smooth - 20) / (220 - 20), 0.0, 1.0) * 255.0
    hd_final_alpha[hd_final_alpha > 200] = 255.0
    hd_final_alpha[hd_final_alpha < 15] = 0.0

    # Ensure edge pixels in HD are padded with clean fish color
    hd_edge = (hd_final_alpha > 0) & (hd_final_alpha < 240)
    hd_edge_b = np.mean(hd_crisp_rgb, axis=2)
    dark_hd_edge = hd_edge & (hd_edge_b < (70 if role == 'candut' else 80))

    if np.sum(dark_hd_edge) > 0:
        hd_clean = (hd_final_alpha == 255) & (hd_edge_b >= (70 if role == 'candut' else 80))
        if np.sum(hd_clean) > 0:
            hd_clean_w = hd_clean.astype(float)
            hd_clean_c = hd_crisp_rgb * hd_clean_w[:, :, None]
            hd_w_pil = Image.fromarray((hd_clean_w * 255).astype(np.uint8), mode='L').filter(ImageFilter.GaussianBlur(14))
            hd_c_pil = Image.fromarray(hd_clean_c.astype(np.uint8), mode='RGB').filter(ImageFilter.GaussianBlur(14))
            hd_bw = np.array(hd_w_pil).astype(float) / 255.0
            hd_bc = np.array(hd_c_pil).astype(float)
            hd_infill = hd_bc / np.clip(hd_bw[:, :, None], 0.0001, 1.0)
            hd_crisp_rgb[dark_hd_edge] = hd_infill[dark_hd_edge]

    final_hd_arr = np.dstack([hd_crisp_rgb, hd_final_alpha]).astype(np.uint8)
    final_hd_im = Image.fromarray(final_hd_arr, mode='RGBA')

    out_p = os.path.join(PUBLIC_DIR, fname)
    final_hd_im.save(out_p)

    solid_pct = np.sum(hd_final_alpha == 255) / np.sum(hd_final_alpha > 0) * 100
    dark_edge_count = np.sum((hd_final_alpha > 10) & (hd_final_alpha < 240) & (np.mean(hd_crisp_rgb, axis=2) < 50))
    print(f"Saved {fname:18s} -> HD ({hd_w}x{hd_h}): Solid={solid_pct:.1f}%, Dark edge pixels (<50)={dark_edge_count}")

def main():
    print("=== Processing Original Fish Designs to True Clean HD ===")
    for stage in range(1, 6):
        for role in ['candut', 'repa']:
            fname = f"{role}_stage{stage}.png"
            process_single_fish(fname, role, stage)
    print("=== All 10 original fish sprites processed to True Clean HD! ===")

if __name__ == '__main__':
    main()

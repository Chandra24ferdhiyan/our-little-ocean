import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from collections import deque

ORIG_DIR = r"C:\Users\acer\.gemini\antigravity\brain\9d22dcdd-d124-4094-9cc2-f352ecbcdd94\scratch\orig_sprites"
PUBLIC_DIR = r"d:\aqua\public\fish"

def process_fish_sprite(img_path, role):
    im = Image.open(img_path).convert("RGBA")
    w, h = im.size
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(float)
    alpha = arr[:, :, 3].astype(float)
    
    filename = os.path.basename(img_path)
    is_repa4 = 'repa_stage4' in filename
    is_repa5 = 'repa_stage5' in filename
    is_candut5 = 'candut_stage5' in filename

    # Known rectangular crop boxes at extreme corners (transparent border padding)
    if is_repa4:
        alpha[341:, :] = 0
    if is_repa5:
        alpha[:, 452:] = 0
        alpha[410:, 130:305] = 0
        alpha[438:, :] = 0
    if is_candut5:
        alpha[390:445, 460:] = 0
        alpha[-15:, 460:] = 0

    # 1. Background Flood Fill from outer image edges
    bg_visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for y in range(h):
        for x in [0, w-1]:
            if alpha[y, x] < 60:
                bg_visited[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in [0, h-1]:
            if not bg_visited[y, x] and alpha[y, x] < 60:
                bg_visited[y, x] = True
                q.append((y, x))
                
    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not bg_visited[ny, nx]:
                # Background: low alpha or dark edge noise touching outside
                if alpha[ny, nx] < 35 or (alpha[ny, nx] < 120 and np.mean(rgb[ny, nx]) < 35):
                    bg_visited[ny, nx] = True
                    q.append((ny, nx))
                    
    fish_solid_envelope = ~bg_visited
    
    # Fill any interior holes in fish envelope
    env_img = Image.fromarray((fish_solid_envelope * 255).astype(np.uint8), mode='L')
    inv_img = Image.eval(env_img, lambda a: 255 if a == 0 else 0)
    inv_arr = np.array(inv_img)
    bg_fill = np.zeros((h, w), dtype=bool)
    fq = deque([(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)])
    for y, x in fq: bg_fill[y, x] = True
    while fq:
        cy, cx = fq.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not bg_fill[ny, nx] and inv_arr[ny, nx] == 255:
                bg_fill[ny, nx] = True
                fq.append((ny, nx))
    solid_envelope = ~bg_fill
    
    # 2. Eye protection mask (black pupil & specular shine)
    eye_mask = np.zeros((h, w), dtype=bool)
    eye_mask[int(h*0.35):int(h*0.65), int(w*0.65):int(w*0.88)] = True
    
    # 3. Clean Solid Body vs Fringe Zone
    # Erode envelope by 1.2px to completely eliminate outer jagged edge and black halo
    env_pil = Image.fromarray((solid_envelope * 255).astype(np.uint8), mode='L')
    eroded_1 = env_pil.filter(ImageFilter.MinFilter(3)) # 1px erosion
    
    # Clean Interior Source (where colors are 100% genuine and not darkened by matte)
    # Brightness threshold for clean body: Candut >= 85, Repa >= 95
    min_clean_b = 85 if role == 'candut' else 95
    
    # Clean color reference mask
    brightness = np.mean(rgb, axis=2)
    clean_color_mask = solid_envelope & (brightness >= min_clean_b)
    
    # If a pixel in solid_envelope is dark (< min_clean_b) and NOT inside the eye:
    # IT IS A BLACK MATTE FRINGE!
    is_fringe = solid_envelope & (brightness < min_clean_b) & (~eye_mask)
    
    # Inpaint fringe pixels using normalized convolution from clean_color_mask!
    clean_weight = clean_color_mask.astype(float)
    clean_rgb = rgb * clean_weight[:, :, None]
    
    weight_pil = Image.fromarray((clean_weight * 255).astype(np.uint8), mode='L')
    color_pil = Image.fromarray(clean_rgb.astype(np.uint8), mode='RGB')
    
    blur_w = np.array(weight_pil.filter(ImageFilter.GaussianBlur(6))).astype(float) / 255.0
    blur_c = np.array(color_pil.filter(ImageFilter.GaussianBlur(6))).astype(float)
    
    infill_rgb = blur_c / np.clip(blur_w[:, :, None], 0.0001, 1.0)
    infill_rgb = np.clip(infill_rgb, 0, 255)
    
    # Replace fringe pixels with infill_rgb!
    final_rgb = rgb.copy()
    final_rgb[is_fringe] = infill_rgb[is_fringe]
    
    # 4. SILKY SMOOTH, NEAT ANTI-ALIASED ALPHA MASK
    # Subpixel Gaussian blur (radius 0.7) on eroded_1 for beautiful neat anti-aliasing
    eroded_pil = eroded_1.filter(ImageFilter.GaussianBlur(0.7))
    arr_e = np.array(eroded_pil).astype(float) / 255.0
    
    # Rescale alpha: 0.12 to 0.70 maps to 0 to 255
    final_alpha = np.clip((arr_e - 0.12) / (0.70 - 0.12), 0.0, 1.0) * 255.0
    
    # Everything inside the body (final_alpha > 220) is 100% SOLID OPAQUE (255)!
    final_alpha[final_alpha > 220] = 255.0
    final_alpha[final_alpha < 15] = 0.0
    
    # Outside envelope: strictly 0
    final_alpha[~solid_envelope] = 0.0
    
    out_arr = np.dstack([final_rgb, final_alpha]).astype(np.uint8)
    return Image.fromarray(out_arr, mode='RGBA')

def make_chibi_baby_sprite(im, role):
    w, h = im.size
    arr = np.array(im).astype(np.float32)

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
    sparkle_draw.ellipse([sp2_x - 1.5, sp2_y - 1.5, sp2_x + 1.5, sp2_y + 1.5], fill=(255, 255, 255, 230))
    warped_im = Image.alpha_composite(warped_im, sparkle_overlay)

    # Ensure body inside baby remains 100% SOLID OPAQUE (alpha = 255)
    baby_arr = np.array(warped_im)
    baby_a = baby_arr[:, :, 3]
    baby_arr[baby_a > 120, 3] = 255
    baby_arr[(baby_a > 0) & (baby_a <= 120), 3] = np.clip(baby_a[(baby_a > 0) & (baby_a <= 120)] * 1.5, 0, 255).astype(np.uint8)

    return Image.fromarray(baby_arr, mode='RGBA')

def main():
    print("=== Processing All 10 Sprites to public/fish ===")
    for stage in range(1, 6):
        for role in ['candut', 'repa']:
            fname = f"{role}_stage{stage}.png"
            in_path = os.path.join(ORIG_DIR, fname)
            out_path = os.path.join(PUBLIC_DIR, fname)
            
            cleaned = process_fish_sprite(in_path, role)
            if stage == 1:
                final = make_chibi_baby_sprite(cleaned, role)
            else:
                final = cleaned
                
            final.save(out_path)
            
            arr = np.array(final)
            a = arr[:, :, 3]
            rgb = arr[:, :, :3]
            padded_zero = np.pad(a < 10, 1, mode='constant', constant_values=True)
            has_zero_nbr = (
                padded_zero[:-2, 1:-1] | padded_zero[2:, 1:-1] |
                padded_zero[1:-1, :-2] | padded_zero[1:-1, 2:]
            )
            edge_m = (a > 10) & has_zero_nbr
            edge_b = np.mean(rgb[edge_m], axis=1)
            
            solid_pct = np.sum(a == 255) / np.sum(a > 0) * 100
            print(f"Saved {fname}: Solid={solid_pct:.1f}%, Edge mean brightness={np.mean(edge_b):.1f}, Edge < 50: {np.sum(edge_b < 50)}/{len(edge_b)}")

if __name__ == '__main__':
    main()

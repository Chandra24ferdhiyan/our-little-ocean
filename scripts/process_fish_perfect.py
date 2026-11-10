import os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from collections import deque

FISH_DIR = 'public/fish'

def process_fish_solid_and_clean_edge(img_path, role, stage):
    im = Image.open(img_path).convert('RGBA')
    w, h = im.size
    arr = np.array(im)
    rgb = arr[:, :, :3].copy()
    alpha = arr[:, :, 3].copy()
    
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

    # 1. Background identification via flood fill from 4 canvas borders
    # Only pixels connected to canvas borders with low alpha or dark empty space are background
    visited_bg = np.zeros((h, w), dtype=bool)
    q = deque()
    
    # Border pixels seed
    for y in range(h):
        for x in [0, w - 1]:
            if alpha[y, x] < 60:
                visited_bg[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in [0, h - 1]:
            if not visited_bg[y, x] and alpha[y, x] < 60:
                visited_bg[y, x] = True
                q.append((y, x))

    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited_bg[ny, nx]:
                # Background flood fill: low alpha (transparent) OR black fringe touching the outer edge
                # STRICTLY alpha < 35 or (alpha < 100 and very low brightness < 30)
                # NEVER penetrate solid body pixels!
                if alpha[ny, nx] < 35 or (alpha[ny, nx] < 100 and np.mean(rgb[ny, nx]) < 30):
                    visited_bg[ny, nx] = True
                    q.append((ny, nx))

    # Fish body silhouette is EVERYTHING not reached by the outside background flood fill!
    fish_mask = ~visited_bg

    # Keep only the single largest connected component in fish_mask (removes isolated border dust)
    solid_mask = fish_mask & (alpha > 30)
    visited_island = np.zeros((h, w), dtype=bool)
    max_island = []
    for y in range(h):
        for x in range(w):
            if solid_mask[y, x] and not visited_island[y, x]:
                island = []
                iq = [(y, x)]
                visited_island[y, x] = True
                while iq:
                    py, px = iq.pop()
                    island.append((py, px))
                    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        my, mx = py + dy, px + dx
                        if 0 <= my < h and 0 <= mx < w and solid_mask[my, mx] and not visited_island[my, mx]:
                            visited_island[my, mx] = True
                            iq.append((my, mx))
                if len(island) > len(max_island):
                    max_island = island

    main_fish_mask = np.zeros((h, w), dtype=bool)
    for py, px in max_island:
        main_fish_mask[py, px] = True

    # Fill any holes inside the main fish mask so the entire interior is SOLID!
    fish_pil = Image.fromarray((main_fish_mask * 255).astype(np.uint8), mode='L')
    # Filling holes: flood fill from corner on inverted mask
    inv_pil = Image.eval(fish_pil, lambda a: 255 if a == 0 else 0)
    inv_arr = np.array(inv_pil)
    
    bg_fill = np.zeros((h, w), dtype=bool)
    fq = deque([(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)])
    for y, x in fq:
        bg_fill[y, x] = True
    while fq:
        cy, cx = fq.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not bg_fill[ny, nx] and inv_arr[ny, nx] == 255:
                bg_fill[ny, nx] = True
                fq.append((ny, nx))

    # The true filled fish silhouette without ANY internal holes:
    solid_fish_silhouette = ~bg_fill

    # 2. SEPARATE INTERIOR BODY FROM OUTER RIM
    # Interior body: eroded by 2 pixels from silhouette
    silhouette_img = Image.fromarray((solid_fish_silhouette * 255).astype(np.uint8), mode='L')
    interior_mask = np.array(silhouette_img.filter(ImageFilter.MinFilter(5))) > 0 # 2px erosion
    rim_mask = solid_fish_silhouette & (~interior_mask) # exactly the 1-2px outer boundary

    # In interior body:
    # 100% PRESERVE all original colors (including black eyes, scales, shading)!
    # 100% SET alpha = 255 (completely solid, NO TRANSPARENCY)!
    final_alpha = np.zeros((h, w), dtype=np.uint8)
    final_alpha[interior_mask] = 255
    final_rgb = rgb.copy()

    # If there were any weird keyed-out pixels inside deep interior in the original (alpha == 0),
    # inpaint their RGB from neighbors so they aren't black/white spots
    deep_zero = interior_mask & (alpha == 0)
    if np.sum(deep_zero) > 0:
        for y, x in zip(*np.where(deep_zero)):
            y1, y2 = max(0, y-2), min(h, y+3)
            x1, x2 = max(0, x-2), min(w, x+3)
            valid = (alpha[y1:y2, x1:x2] > 50) & interior_mask[y1:y2, x1:x2]
            if np.sum(valid) > 0:
                final_rgb[y, x] = np.mean(final_rgb[y1:y2, x1:x2][valid], axis=0).astype(np.uint8)

    # 3. CLEAN ONLY THE RIM (GARIS PINGGIR HITAM)
    # On the rim, if a pixel is dark fringe (contaminated by black background),
    # sample color from the neighboring interior fish pixels!
    # And give it clean anti-aliased edge alpha.
    for y, x in zip(*np.where(rim_mask)):
        y1, y2 = max(0, y-2), min(h, y+3)
        x1, x2 = max(0, x-2), min(w, x+3)
        nbr_interior = interior_mask[y1:y2, x1:x2]
        
        orig_color = rgb[y, x]
        orig_bright = np.mean(orig_color)
        
        if np.sum(nbr_interior) > 0:
            nbr_colors = final_rgb[y1:y2, x1:x2][nbr_interior]
            nbr_mean_bright = np.mean(nbr_colors)
            
            # If the rim pixel is significantly darker than its interior neighbor, it's a black fringe!
            if orig_bright < 65 and nbr_mean_bright > 80:
                # Replace contaminated black border color with the clean fish interior color!
                final_rgb[y, x] = np.mean(nbr_colors, axis=0).astype(np.uint8)
                final_alpha[y, x] = 200 # smooth clean edge
            elif orig_bright < 40:
                final_rgb[y, x] = np.mean(nbr_colors, axis=0).astype(np.uint8)
                final_alpha[y, x] = 180
            else:
                # Already a clean color: keep original color, set solid/smooth alpha
                final_alpha[y, x] = max(190, alpha[y, x])
        else:
            final_alpha[y, x] = max(160, alpha[y, x])

    # Outside the silhouette: 100% transparent
    final_alpha[~solid_fish_silhouette] = 0

    clean_im = Image.fromarray(np.dstack([final_rgb, final_alpha]), mode='RGBA')
    return clean_im

def make_chibi_baby_sprite_solid(clean_im, role):
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
    sparkle_draw.ellipse([sp2_x - 1.5, sp2_y - 1.5, sp2_x + 1.5, sp2_y + 1.5], fill=(255, 255, 255, 230))
    warped_im = Image.alpha_composite(warped_im, sparkle_overlay)

    # Ensure body inside baby remains 100% SOLID OPAQUE (alpha = 255)
    baby_arr = np.array(warped_im)
    baby_a = baby_arr[:, :, 3]
    baby_arr[baby_a > 128, 3] = 255
    baby_arr[(baby_a > 0) & (baby_a <= 128), 3] = np.clip(baby_a[(baby_a > 0) & (baby_a <= 128)] * 1.5, 0, 255).astype(np.uint8)

    return Image.fromarray(baby_arr, mode='RGBA')

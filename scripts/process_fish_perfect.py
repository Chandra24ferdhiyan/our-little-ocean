import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np
import colorsys
import math

MASTER_PINK_PATH = r"C:\Users\acer\.gemini\antigravity\brain\9d22dcdd-d124-4094-9cc2-f352ecbcdd94\.user_uploaded\media_1794330160554_bcdc1f41.png"
PUBLIC_DIR = r"d:\aqua\public\fish"
os.makedirs(PUBLIC_DIR, exist_ok=True)

# -------------------------------------------------------------
# Base Stage 2: Master Sprites
# -------------------------------------------------------------
def get_clean_repa_stage2():
    im = Image.open(MASTER_PINK_PATH).convert("RGBA")
    arr = np.array(im)
    a = arr[:, :, 3].copy()
    a[a > 180] = 255
    arr[:, :, 3] = a
    return Image.fromarray(arr, mode='RGBA')

def get_clean_candut_stage2(repa_im):
    w, h = repa_im.size
    arr = np.array(repa_im).astype(float)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    out_rgb = np.zeros((h, w, 3), dtype=np.uint8)

    for y in range(h):
        for x in range(w):
            if a[y, x] > 5:
                hv, sv, vv = colorsys.rgb_to_hsv(r[y, x] / 255.0, g[y, x] / 255.0, b[y, x] / 255.0)
                is_mouth = (x > 910 and 420 < y < 490 and (0.95 < hv or hv < 0.05)) and sv > 0.6
                is_eye_pupil = (725 < x < 880 and 440 < y < 600) and vv < 0.15 and sv < 0.4
                
                if is_mouth:
                    new_h, new_s, new_v = hv, sv, vv
                elif is_eye_pupil:
                    new_h, new_s, new_v = 0.58, 0.0, vv
                elif sv < 0.08:
                    new_h, new_s, new_v = hv, sv, vv
                else:
                    new_h = (hv - 0.35) % 1.0
                    new_s = sv * 0.95
                    new_v = max(0.22, vv) if vv > 0 else 0

                nr, ng, nb = colorsys.hsv_to_rgb(new_h, new_s, new_v)
                out_rgb[y, x] = [int(nr * 255), int(ng * 255), int(nb * 255)]

    final_alpha = a.copy()
    final_alpha[final_alpha > 180] = 255
    return Image.fromarray(np.dstack([out_rgb, final_alpha.astype(np.uint8)]), mode='RGBA')

# -------------------------------------------------------------
# Clean Defringing Post-Process Helper
# -------------------------------------------------------------
def clean_defringe(im, role):
    w, h = im.size
    arr = np.array(im).astype(float)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]

    alpha[alpha > 190] = 255
    alpha[alpha < 12] = 0

    edge = (alpha > 5) & (alpha < 240)
    b = np.mean(rgb, axis=2)
    dark_edge = edge & (b < 45)

    if np.sum(dark_edge) > 0:
        clean_solid = (alpha == 255) & (b > 60)
        if np.sum(clean_solid) > 0:
            solid_weight = clean_solid.astype(float)
            solid_rgb = rgb * solid_weight[:, :, None]
            w_pil = Image.fromarray((solid_weight * 255).astype(np.uint8), mode='L').filter(ImageFilter.GaussianBlur(8))
            c_pil = Image.fromarray(solid_rgb.astype(np.uint8), mode='RGB').filter(ImageFilter.GaussianBlur(8))
            bw = np.array(w_pil).astype(float) / 255.0
            bc = np.array(c_pil).astype(float)
            infill = bc / np.clip(bw[:, :, None], 0.0001, 1.0)
            rgb[dark_edge] = infill[dark_edge]

    final_arr = np.dstack([rgb, alpha]).astype(np.uint8)
    return Image.fromarray(final_arr, mode='RGBA')

# -------------------------------------------------------------
# Stage 1: Chibi Baby Fry
# -------------------------------------------------------------
def make_stage1(base_im, role):
    w, h = base_im.size
    arr = np.array(base_im).astype(np.float32)

    eye_x, eye_y = 800.0, 380.0
    y_coords, x_coords = np.mgrid[0:h, 0:w]
    bc_x, bc_y = w * 0.48, h * 0.52
    nx = (x_coords - bc_x) / (w * 0.5)
    ny = (y_coords - bc_y) / (h * 0.5)

    warp_x = x_coords.copy().astype(float)
    warp_y = y_coords.copy().astype(float)

    # Shorter compact baby tail
    tail_factor = np.clip(-nx, 0, 1) ** 1.2
    warp_x += tail_factor * 28.0

    # Chubby baby tummy
    dist_body = np.hypot(nx, ny)
    bulge = np.exp(-dist_body ** 2 / 0.52)
    warp_x -= nx * bulge * 14.0
    warp_y -= ny * bulge * 14.0

    # Big cute baby cranium and eye
    head_dist = np.hypot((x_coords - eye_x) / 110.0, (y_coords - eye_y) / 110.0)
    head_bulge = np.exp(-head_dist ** 2 / 1.3) * 11.0
    warp_x -= (x_coords - eye_x) / 110.0 * head_bulge
    warp_y -= (y_coords - eye_y) / 110.0 * head_bulge

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
    baby_im = Image.fromarray(warped_arr.astype(np.uint8), mode='RGBA')

    # Rosy / cyan baby blush on cheek
    blush_overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    blush_draw = ImageDraw.Draw(blush_overlay)
    cheek_x, cheek_y = 810, 470
    blush_color = (255, 120, 155, 150) if role == 'repa' else (100, 190, 255, 150)
    for r in range(35, 0, -3):
        a_step = int(blush_color[3] * (1.0 - r / 35.0))
        c = (blush_color[0], blush_color[1], blush_color[2], a_step)
        blush_draw.ellipse([cheek_x - r * 1.4, cheek_y - r * 0.9, cheek_x + r * 1.4, cheek_y + r * 0.9], fill=c)
    baby_im = Image.alpha_composite(baby_im, blush_overlay)

    # Extra sparkle stars in baby eyes
    glint_overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    glint_draw = ImageDraw.Draw(glint_overlay)
    glint_draw.ellipse([825, 345, 848, 368], fill=(255, 255, 255, 250))
    glint_draw.ellipse([788, 420, 804, 436], fill=(255, 255, 255, 240))
    baby_im = Image.alpha_composite(baby_im, glint_overlay)

    return clean_defringe(baby_im, role)

# -------------------------------------------------------------
# Stage 3: Accessories (Sailor Hat for Candut, Flower for Saridut)
# -------------------------------------------------------------
def make_stage3_candut(base_im):
    w, h = base_im.size
    im = base_im.copy()
    acc = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(acc)

    # Cute anime sailor hat at x=685, y=170
    # 1. Shadow underneath
    draw.ellipse([640, 195, 755, 225], fill=(20, 45, 70, 70))
    
    # 2. Dark navy brim band
    draw.polygon([
        (645, 202), (695, 192), (748, 200), (745, 218), (695, 222), (643, 216)
    ], fill=(18, 38, 68, 255))
    draw.line([(645, 202), (695, 192), (748, 200), (745, 218), (695, 222), (643, 216), (645, 202)], fill=(10, 20, 40, 255), width=3)

    # 3. Crisp white sailor cap crown
    draw.polygon([
        (650, 198), (642, 160), (670, 138), (722, 142), (744, 168), (742, 198)
    ], fill=(255, 255, 255, 255))
    draw.polygon([
        (650, 198), (642, 160), (670, 138), (680, 194)
    ], fill=(225, 235, 248, 255))
    draw.line([
        (650, 198), (642, 160), (670, 138), (722, 142), (744, 168), (742, 198)
    ], fill=(30, 50, 80, 255), width=3)

    # 4. Golden Anchor Insignia on navy brim
    draw.ellipse([690, 197, 702, 209], outline=(255, 215, 60, 255), width=2)
    draw.line([(696, 204), (696, 219)], fill=(255, 215, 60, 255), width=2)
    draw.line([(691, 208), (701, 208)], fill=(255, 215, 60, 255), width=2)
    draw.arc([689, 210, 703, 221], start=0, end=180, fill=(255, 215, 60, 255), width=2)

    acc = acc.filter(ImageFilter.GaussianBlur(0.4))
    im.alpha_composite(acc)
    return clean_defringe(im, 'candut')

def make_stage3_repa(base_im):
    w, h = base_im.size
    im = base_im.copy()
    acc = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(acc)

    cx, cy = 695, 190
    draw.ellipse([cx - 45, cy - 35, cx + 45, cy + 50], fill=(80, 20, 45, 60))

    petal_len = 38
    petal_w = 22
    for i in range(5):
        angle = i * (2 * math.pi / 5) - math.pi / 2
        px = cx + math.cos(angle) * petal_len
        py = cy + math.sin(angle) * petal_len
        
        draw.ellipse([
            px - petal_w, py - petal_w, px + petal_w, py + petal_w
        ], fill=(255, 160, 195, 255), outline=(180, 40, 90, 255), width=3)
        draw.ellipse([
            px - petal_w * 0.65, py - petal_w * 0.65, px + petal_w * 0.65, py + petal_w * 0.65
        ], fill=(255, 215, 235, 255))

    for i in range(8):
        angle = i * (2 * math.pi / 8)
        sx = cx + math.cos(angle) * 16
        sy = cy + math.sin(angle) * 16
        draw.line([(cx, cy), (sx, sy)], fill=(255, 220, 80, 255), width=2)
        draw.ellipse([sx - 2, sy - 2, sx + 2, sy + 2], fill=(255, 235, 120, 255))

    draw.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], fill=(255, 255, 255, 255), outline=(220, 180, 200, 255), width=2)
    draw.ellipse([cx - 7, cy - 7, cx - 2, cy - 2], fill=(255, 255, 255, 255))

    acc = acc.filter(ImageFilter.GaussianBlur(0.4))
    im.alpha_composite(acc)
    return clean_defringe(im, 'repa')

# -------------------------------------------------------------
# Stage 4: Extended Flowing Butterfly Veil Fins
# -------------------------------------------------------------
def make_stage4(base_im, role):
    w, h = base_im.size
    im = base_im.copy()
    
    veil_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(veil_layer)
    
    base_color = (130, 210, 255) if role == 'candut' else (255, 165, 210)
    rim_color = (40, 120, 220) if role == 'candut' else (210, 50, 120)

    ribbons = [
        [(220, 250), (165, 200), (105, 175), (55, 195), (75, 225), (135, 230), (200, 275)],
        [(175, 340), (115, 330), (60, 370), (45, 410), (85, 420), (145, 380), (195, 360)],
        [(220, 430), (165, 470), (105, 515), (60, 540), (80, 565), (140, 525), (210, 460)],
    ]

    for rib in ribbons:
        v_draw.polygon(rib, fill=(base_color[0], base_color[1], base_color[2], 160))
        v_draw.line(rib + [rib[0]], fill=(rim_color[0], rim_color[1], rim_color[2], 230), width=3)
        inner_shine = [(p[0] + 5, p[1] - 3) for p in rib[:4]]
        v_draw.line(inner_shine, fill=(255, 255, 255, 200), width=2)

    veil_layer = veil_layer.filter(ImageFilter.GaussianBlur(0.6))
    composite_im = Image.alpha_composite(veil_layer, im)
    return clean_defringe(composite_im, role)

# -------------------------------------------------------------
# Stage 5: Eternal Ocean Royal Kingship / Queenship (Crowns & Gold)
# -------------------------------------------------------------
def make_stage5(base_im, role):
    w, h = base_im.size
    im = make_stage4(base_im, role)
    crown_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(crown_layer)

    if role == 'candut':
        draw.ellipse([670, 190, 760, 215], fill=(20, 25, 40, 80))

        draw.polygon([
            (675, 195), (715, 188), (755, 194), (752, 206), (715, 210), (673, 203)
        ], fill=(255, 205, 50, 255))
        draw.line([
            (675, 195), (715, 188), (755, 194), (752, 206), (715, 210), (673, 203), (675, 195)
        ], fill=(160, 110, 20, 255), width=3)

        crown_points = [
            (676, 195), (665, 140), (688, 168),
            (715, 118),
            (742, 168), (765, 140), (754, 194)
        ]
        draw.polygon(crown_points, fill=(255, 220, 65, 255))
        draw.line(crown_points, fill=(160, 110, 20, 255), width=3)

        draw.polygon([(715, 122), (710, 188), (720, 188)], fill=(255, 245, 150, 255))
        for tx, ty in [(665, 140), (715, 118), (765, 140)]:
            draw.ellipse([tx - 5, ty - 5, tx + 5, ty + 5], fill=(255, 245, 180, 255), outline=(160, 110, 20, 255), width=2)

        draw.polygon([(715, 148), (706, 164), (715, 180), (724, 164)], fill=(30, 120, 255, 255), outline=(10, 50, 140, 255), width=2)
        draw.polygon([(715, 150), (709, 162), (715, 166)], fill=(160, 215, 255, 255))

    else:
        draw.ellipse([670, 192, 760, 215], fill=(40, 15, 25, 80))
        draw.arc([670, 180, 760, 215], start=0, end=180, fill=(255, 215, 60, 255), width=4)

        tiara_points = [
            (675, 194), (672, 162), (692, 172),
            (715, 128),
            (738, 172), (758, 162), (755, 194)
        ]
        draw.polygon(tiara_points, fill=(255, 225, 80, 255))
        draw.line(tiara_points, fill=(180, 120, 25, 255), width=3)

        for tx, ty in [(672, 162), (715, 128), (758, 162)]:
            draw.ellipse([tx - 4, ty - 4, tx + 4, ty + 4], fill=(255, 255, 255, 255), outline=(180, 120, 25, 255), width=2)

        draw.polygon([
            (715, 150), (707, 164), (715, 178), (723, 164)
        ], fill=(240, 30, 95, 255), outline=(140, 10, 50, 255), width=2)
        draw.polygon([(715, 152), (709, 162), (715, 165)], fill=(255, 180, 210, 255))

    crown_layer = crown_layer.filter(ImageFilter.GaussianBlur(0.35))
    im.alpha_composite(crown_layer)

    return clean_defringe(im, role)

def main():
    print("=== Processing New HD Sprites into public/fish ===")
    repa_stage2 = get_clean_repa_stage2()
    candut_stage2 = get_clean_candut_stage2(repa_stage2)

    candut_stage1 = make_stage1(candut_stage2, 'candut')
    repa_stage1 = make_stage1(repa_stage2, 'repa')

    candut_stage3 = make_stage3_candut(candut_stage2)
    repa_stage3 = make_stage3_repa(repa_stage2)

    candut_stage4 = make_stage4(candut_stage2, 'candut')
    repa_stage4 = make_stage4(repa_stage2, 'repa')

    candut_stage5 = make_stage5(candut_stage2, 'candut')
    repa_stage5 = make_stage5(repa_stage2, 'repa')

    sprites = {
        'candut_stage1.png': candut_stage1,
        'repa_stage1.png': repa_stage1,
        'candut_stage2.png': candut_stage2,
        'repa_stage2.png': repa_stage2,
        'candut_stage3.png': candut_stage3,
        'repa_stage3.png': repa_stage3,
        'candut_stage4.png': candut_stage4,
        'repa_stage4.png': repa_stage4,
        'candut_stage5.png': candut_stage5,
        'repa_stage5.png': repa_stage5,
    }

    for name, img in sprites.items():
        out_p = os.path.join(PUBLIC_DIR, name)
        img.save(out_p)
        print(f"Saved {name:18s} -> {out_p}")

if __name__ == '__main__':
    main()

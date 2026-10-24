import os
import glob
from PIL import Image

themes = [
    ('coral_sanctuary_bg', 'coral-sanctuary', 'theme_coral_sanctuary'),
    ('crystal_cave_bg', 'crystal-cave', 'theme_crystal_cave'),
    ('aurora_ocean_bg', 'aurora-ocean', 'theme_aurora_ocean'),
    ('golden_atlantis_bg', 'golden-atlantis', 'theme_golden_atlantis'),
    ('sakura_springs_bg', 'sakura-springs', 'theme_sakura_springs'),
]

brain_dir = r'C:\Users\acer\.gemini\antigravity-ide\brain\22970d5e-c84f-4e94-96ee-93485cb3f551'
mask_ref = Image.open('public/icons/theme_ocean_dream.png').convert('RGBA')
alpha_mask = mask_ref.getchannel('A')

for prefix, theme_id, icon_name in themes:
    matches = glob.glob(os.path.join(brain_dir, f'{prefix}_*.jpg'))
    if not matches:
        print(f'Error: no file for {prefix}')
        continue
    latest = sorted(matches)[-1]
    
    # 1. Save theme background
    dest_bg = f'public/themes/{theme_id}.jpg'
    with Image.open(latest) as img:
        bg = img.convert('RGB')
        if bg.size != (1920, 1080):
            bg = bg.resize((1920, 1080), Image.Resampling.LANCZOS)
        bg.save(dest_bg, 'JPEG', quality=94)
        print(f'Saved {dest_bg}')
        
        # 2. Create squircle icon (256x256)
        w, h = bg.size
        crop_size = min(w, h)
        left = (w - crop_size) // 2
        top = (h - crop_size) // 2
        square = bg.crop((left, top, left + crop_size, top + crop_size))
        square_256 = square.resize((256, 256), Image.Resampling.LANCZOS).convert('RGBA')
        square_256.putalpha(alpha_mask)
        
        dest_icon = f'public/icons/{icon_name}.png'
        square_256.save(dest_icon, 'PNG')
        print(f'Saved {dest_icon}')

print('ALL_THEMES_PROCESSED_SUCCESSFULLY')

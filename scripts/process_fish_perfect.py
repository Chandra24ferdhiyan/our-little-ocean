import os
import shutil

FISH_DIR = r"d:\aqua\public\fish"

def sync_sprites():
    """
    Ensures all 10 newest fish sprites placed by user have both:
    1. Direct space-separated names ('candut stage 1.png', 'saridut stage 1.png')
    2. Underscore alias names ('candut_stage1.png', 'saridut_stage1.png', 'repa_stage1.png')
    """
    for stage in range(1, 6):
        # Candut
        src_candut = os.path.join(FISH_DIR, f"candut stage {stage}.png")
        dst_candut = os.path.join(FISH_DIR, f"candut_stage{stage}.png")
        if os.path.exists(src_candut):
            shutil.copy2(src_candut, dst_candut)
            print(f"Synced {src_candut} -> {dst_candut}")
            
        # Saridut & Repa
        src_saridut = os.path.join(FISH_DIR, f"saridut stage {stage}.png")
        dst_saridut = os.path.join(FISH_DIR, f"saridut_stage{stage}.png")
        dst_repa = os.path.join(FISH_DIR, f"repa_stage{stage}.png")
        if os.path.exists(src_saridut):
            shutil.copy2(src_saridut, dst_saridut)
            shutil.copy2(src_saridut, dst_repa)
            print(f"Synced {src_saridut} -> {dst_saridut} and {dst_repa}")

if __name__ == "__main__":
    sync_sprites()
    print("All fish sprite aliases successfully synchronized!")

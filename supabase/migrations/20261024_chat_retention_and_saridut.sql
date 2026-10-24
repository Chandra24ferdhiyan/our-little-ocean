-- ==============================================================================
-- CANDUT & SARIDUT — MIGRATION 20261024:
-- 1. Support 10 HD Aquarium Themes (Expand active_theme check constraint)
-- 2. 7-Day Automatic Chat Message Retention (Purge messages > 7 days)
-- 3. Permanent rename of Repa -> Saridut in profiles and message history
-- ==============================================================================

-- 1. Perbarui constraint tema aktif agar mendukung 10 tema HD
ALTER TABLE public.aquariums DROP CONSTRAINT IF EXISTS aquariums_active_theme_check;
ALTER TABLE public.aquariums ADD CONSTRAINT aquariums_active_theme_check CHECK (
  active_theme IN (
    'ocean-dream', 
    'love-lagoon', 
    'zen-garden', 
    'midnight-ocean', 
    'sunset-bay',
    'coral-sanctuary', 
    'crystal-cave', 
    'aurora-ocean', 
    'golden-atlantis', 
    'sakura-springs'
  )
);

-- 2. Pastikan profil pasangan menggunakan nama Saridut secara permanen
UPDATE public.profiles
SET display_name = 'Saridut'
WHERE id = '00000000-0000-0000-0000-000000000002' OR partner_role = 'repa';

-- 3. Perbarui riwayat pesan lama yang masih bertuliskan Repa menjadi Saridut
UPDATE public.bubble_messages
SET sender_name = 'Saridut'
WHERE sender_role = 'repa' OR sender_name ILIKE '%repa%';

-- 4. Hapus riwayat pesan chat yang usianya lebih dari 7 hari (Retensi 7 Hari)
DELETE FROM public.bubble_messages
WHERE created_at < NOW() - INTERVAL '7 days';

-- 5. Tambahkan index pada created_at untuk query filter dan pembersihan berkala cepat
CREATE INDEX IF NOT EXISTS idx_bubble_messages_created_at ON public.bubble_messages(created_at);

-- 6. Fungsi otomatis untuk membersihkan pesan > 7 hari
CREATE OR REPLACE FUNCTION public.clean_expired_bubble_messages()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.bubble_messages
  WHERE created_at < NOW() - INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger pembersihan otomatis setiap kali pesan baru dikirim (self-maintaining)
DROP TRIGGER IF EXISTS trigger_clean_expired_messages ON public.bubble_messages;
CREATE TRIGGER trigger_clean_expired_messages
AFTER INSERT ON public.bubble_messages
FOR EACH STATEMENT
EXECUTE FUNCTION public.clean_expired_bubble_messages();

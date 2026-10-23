-- ====================================================================
-- CANDUT & REPA — FIX SYNC & INTEGRATION FOR 2 ROLES
-- Jalankan skrip ini di Supabase SQL Editor (1 kali klik "Run")
-- ====================================================================

-- 1. Tambahkan kolom category jika belum ada pada bubble_messages
ALTER TABLE public.bubble_messages ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'love';

-- 2. Lepaskan constraint ke auth.users agar profile Candut & Repa bisa langsung aktif tanpa sistem login email
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Masukkan profil Candut dan Repa dengan ID tetap
INSERT INTO public.profiles (id, display_name, partner_role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Candut', 'candut'),
  ('00000000-0000-0000-0000-000000000002', 'Repa', 'repa')
ON CONFLICT (id) DO UPDATE 
SET display_name = EXCLUDED.display_name, partner_role = EXCLUDED.partner_role;

-- 4. Hubungkan Candut & Repa ke data pasangan (couple)
INSERT INTO public.couples (id, partner_one_id, partner_two_id, invitation_code, invitation_code_hash)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'OCEAN-LOVE7',
  'hash_ocean_love_7'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Masukkan akuarium bersama Candut & Repa
INSERT INTO public.aquariums (id, couple_id, current_level, current_xp, pellet_balance, active_theme)
VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000010',
  1,
  25,
  5,
  'ocean-dream'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Izinkan akses publik (anon) untuk sync real-time antar perangkat Candut & Repa
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.aquariums DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bubble_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pellet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_unlocks DISABLE ROW LEVEL SECURITY;

-- 7. Pastikan Supabase Realtime aktif untuk tabel aquariums, bubble_messages, dan pellet_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'aquariums'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.aquariums;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bubble_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bubble_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pellet_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pellet_transactions;
  END IF;
END $$;

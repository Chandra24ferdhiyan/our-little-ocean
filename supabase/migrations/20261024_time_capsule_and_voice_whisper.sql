-- ==============================================================================
-- CANDUT & SARIDUT — MIGRATION 20261024_B:
-- 1. Support Time Capsules (is_capsule, unlock_at)
-- 2. Support Voice Whisper Notes (audio_url, audio_duration)
-- 3. Guard Time Capsules from premature 7-day retention deletion
-- ==============================================================================

-- 1. Tambah kolom Time Capsule dan Voice Note pada bubble_messages
ALTER TABLE public.bubble_messages ADD COLUMN IF NOT EXISTS is_capsule BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bubble_messages ADD COLUMN IF NOT EXISTS unlock_at TIMESTAMPTZ;
ALTER TABLE public.bubble_messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.bubble_messages ADD COLUMN IF NOT EXISTS audio_duration REAL;

-- 2. Pastikan pesan audio boleh memiliki message pendek / default
ALTER TABLE public.bubble_messages DROP CONSTRAINT IF EXISTS bubble_messages_message_check;
ALTER TABLE public.bubble_messages ADD CONSTRAINT bubble_messages_message_check 
  CHECK (char_length(message) >= 0 AND char_length(message) <= 1000);

-- 3. Perbarui pembersihan retensi agar kapsul waktu tidak terhapus sebelum dibuka
CREATE OR REPLACE FUNCTION public.clean_expired_bubble_messages()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.bubble_messages
  WHERE (
    -- Pesan biasa: kedaluwarsa setelah 7 hari
    (is_capsule IS NOT TRUE AND created_at < NOW() - INTERVAL '7 days')
    OR
    -- Kapsul waktu: hanya kedaluwarsa 7 hari SETELAH waktu terbukanya tiba
    (is_capsule IS TRUE AND unlock_at IS NOT NULL AND unlock_at < NOW() - INTERVAL '7 days')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clean_expired_messages ON public.bubble_messages;
CREATE TRIGGER trigger_clean_expired_messages
AFTER INSERT ON public.bubble_messages
FOR EACH STATEMENT
EXECUTE FUNCTION public.clean_expired_bubble_messages();

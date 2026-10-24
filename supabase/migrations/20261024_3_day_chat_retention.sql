-- ==============================================================================
-- CANDUT & SARIDUT — MIGRATION 20261024_D:
-- 3-Day Automatic Chat Message Retention Policy (Purge messages > 3 days)
-- ==============================================================================

-- 1. Bersihkan segera pesan yang usianya lebih dari 3 hari
DELETE FROM public.bubble_messages
WHERE (
  -- Pesan biasa: kedaluwarsa setelah 3 hari
  (is_capsule IS NOT TRUE AND created_at < NOW() - INTERVAL '3 days')
  OR
  -- Kapsul waktu: hanya kedaluwarsa 3 hari SETELAH waktu terbukanya tiba
  (is_capsule IS TRUE AND unlock_at IS NOT NULL AND unlock_at < NOW() - INTERVAL '3 days')
);

-- 2. Perbarui trigger fungsi pembersihan otomatis setiap kali ada pesan baru
CREATE OR REPLACE FUNCTION public.clean_expired_bubble_messages()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.bubble_messages
  WHERE (
    -- Pesan biasa: kedaluwarsa setelah 3 hari
    (is_capsule IS NOT TRUE AND created_at < NOW() - INTERVAL '3 days')
    OR
    -- Kapsul waktu: hanya kedaluwarsa 3 hari SETELAH waktu terbukanya tiba
    (is_capsule IS TRUE AND unlock_at IS NOT NULL AND unlock_at < NOW() - INTERVAL '3 days')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clean_expired_messages ON public.bubble_messages;
CREATE TRIGGER trigger_clean_expired_messages
AFTER INSERT ON public.bubble_messages
FOR EACH STATEMENT
EXECUTE FUNCTION public.clean_expired_bubble_messages();

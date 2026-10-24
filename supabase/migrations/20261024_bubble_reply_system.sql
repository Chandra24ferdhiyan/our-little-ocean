-- ==============================================================================
-- CANDUT & SARIDUT — MIGRATION 20261024_C:
-- Support Message Reply / Quoted Reply System
-- 1. reply_to_id (UUID ref to parent message)
-- 2. reply_to_sender_name (Snapshot of replied sender)
-- 3. reply_to_message (Snapshot of replied text/voice)
-- ==============================================================================

-- 1. Tambah kolom relasi balasan pesan pada tabel bubble_messages
ALTER TABLE public.bubble_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.bubble_messages(id) ON DELETE SET NULL;
ALTER TABLE public.bubble_messages ADD COLUMN IF NOT EXISTS reply_to_sender_name TEXT;
ALTER TABLE public.bubble_messages ADD COLUMN IF NOT EXISTS reply_to_message TEXT;

-- 2. Index untuk pencarian pesan balasan
CREATE INDEX IF NOT EXISTS idx_bubble_reply_to ON public.bubble_messages(reply_to_id);

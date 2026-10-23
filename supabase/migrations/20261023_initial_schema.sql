-- ====================================================================
-- CANDUT & REPA — OUR LITTLE OCEAN
-- Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Version: 1.0.0
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    partner_role TEXT NOT NULL CHECK (partner_role IN ('candut', 'repa')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. COUPLES TABLE
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_one_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_two_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    invitation_code_hash TEXT NOT NULL UNIQUE,
    invitation_code TEXT NOT NULL UNIQUE,
    anniversary_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_partners CHECK (partner_one_id != partner_two_id)
);

CREATE INDEX IF NOT EXISTS idx_couples_partners ON public.couples(partner_one_id, partner_two_id);

-- 4. AQUARIUMS TABLE (Level 1-500, Pellet Balance, Active Theme)
CREATE TABLE IF NOT EXISTS public.aquariums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL UNIQUE REFERENCES public.couples(id) ON DELETE CASCADE,
    current_level INT NOT NULL DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 500),
    current_xp INT NOT NULL DEFAULT 0 CHECK (current_xp >= 0),
    pellet_balance INT NOT NULL DEFAULT 5 CHECK (pellet_balance >= 0),
    active_theme TEXT NOT NULL DEFAULT 'ocean-dream' CHECK (active_theme IN ('ocean-dream', 'love-lagoon', 'zen-garden', 'midnight-ocean', 'sunset-bay')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_aquariums_couple ON public.aquariums(couple_id);

-- 5. PELLET TRANSACTIONS TABLE (Immutable ledger preventing double spend & negative balance)
CREATE TABLE IF NOT EXISTS public.pellet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('daily_claim', 'feed', 'secret_02', 'secret_03', 'secret_04', 'secret_05', 'bonus')),
    amount INT NOT NULL, -- Negative for feed, positive for claims
    idempotency_key TEXT NOT NULL UNIQUE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pellet_tx_aquarium ON public.pellet_transactions(aquarium_id);
CREATE INDEX IF NOT EXISTS idx_pellet_tx_actor ON public.pellet_transactions(actor_id);

-- 6. DAILY CLAIMS TABLE (Enforces 1 claim per day server-side)
CREATE TABLE IF NOT EXISTS public.daily_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    claim_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_daily_claim_per_aquarium UNIQUE (aquarium_id, user_id, claim_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_claims_lookup ON public.daily_claims(aquarium_id, user_id, claim_date);

-- 7. BUBBLE MESSAGES TABLE (Romantic floating messages with recipient lock)
CREATE TABLE IF NOT EXISTS public.bubble_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id),
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('candut', 'repa')),
    message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 500),
    bubble_color TEXT NOT NULL DEFAULT 'bubble-pink',
    emoji TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read')),
    x_pos REAL NOT NULL DEFAULT 50.0 CHECK (x_pos >= 5.0 AND x_pos <= 95.0),
    y_pos REAL NOT NULL DEFAULT 50.0 CHECK (y_pos >= 10.0 AND y_pos <= 85.0),
    drift_speed REAL NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bubble_aquarium ON public.bubble_messages(aquarium_id, status);
CREATE INDEX IF NOT EXISTS idx_bubble_recipient ON public.bubble_messages(recipient_id);

-- 8. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
    achievement_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_achievement_aquarium UNIQUE (aquarium_id, achievement_code)
);

-- 9. THEME UNLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.theme_unlocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aquarium_id UUID NOT NULL REFERENCES public.aquariums(id) ON DELETE CASCADE,
    theme_code TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_theme_unlock_aquarium UNIQUE (aquarium_id, theme_code)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aquariums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pellet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bubble_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_unlocks ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read partner profile; users can update only their own profile
CREATE POLICY "Profiles readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Couples: Only partners involved can select and update their couple row
CREATE POLICY "Partners can view their couple"
ON public.couples FOR SELECT TO authenticated
USING (auth.uid() = partner_one_id OR auth.uid() = partner_two_id);

CREATE POLICY "Partner one can insert couple"
ON public.couples FOR INSERT TO authenticated
WITH CHECK (auth.uid() = partner_one_id);

CREATE POLICY "Partners can update couple"
ON public.couples FOR UPDATE TO authenticated
USING (auth.uid() = partner_one_id OR auth.uid() = partner_two_id);

-- Aquariums: Only partners in the couple can view & update
CREATE POLICY "Partners can view their aquarium"
ON public.aquariums FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.couples c 
        WHERE c.id = aquariums.couple_id 
        AND (c.partner_one_id = auth.uid() OR c.partner_two_id = auth.uid())
    )
);

CREATE POLICY "Partners can update their aquarium"
ON public.aquariums FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.couples c 
        WHERE c.id = aquariums.couple_id 
        AND (c.partner_one_id = auth.uid() OR c.partner_two_id = auth.uid())
    )
);

-- Pellet Transactions: Only aquarium partners can view & insert
CREATE POLICY "Partners can view transactions"
ON public.pellet_transactions FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.aquariums a
        JOIN public.couples c ON c.id = a.couple_id
        WHERE a.id = pellet_transactions.aquarium_id
        AND (c.partner_one_id = auth.uid() OR c.partner_two_id = auth.uid())
    )
);

-- Daily Claims: Only aquarium partners can view
CREATE POLICY "Partners can view daily claims"
ON public.daily_claims FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.aquariums a
        JOIN public.couples c ON c.id = a.couple_id
        WHERE a.id = daily_claims.aquarium_id
        AND (c.partner_one_id = auth.uid() OR c.partner_two_id = auth.uid())
    )
);

-- Bubble Messages:
-- Both partners can view bubbles floating in their aquarium
CREATE POLICY "Partners can view aquarium bubbles"
ON public.bubble_messages FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.aquariums a
        JOIN public.couples c ON c.id = a.couple_id
        WHERE a.id = bubble_messages.aquarium_id
        AND (c.partner_one_id = auth.uid() OR c.partner_two_id = auth.uid())
    )
);

-- Sender can insert bubble
CREATE POLICY "Sender can create bubble message"
ON public.bubble_messages FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.aquariums a
        JOIN public.couples c ON c.id = a.couple_id
        WHERE a.id = bubble_messages.aquarium_id
        AND (c.partner_one_id = auth.uid() OR c.partner_two_id = auth.uid())
    )
);

-- Only recipient can update message to 'read'
CREATE POLICY "Recipient can mark message read"
ON public.bubble_messages FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id AND status = 'read');

-- Achievements & Theme Unlocks
CREATE POLICY "Partners can view achievements"
ON public.achievements FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.aquariums a
        JOIN public.couples c ON c.id = a.couple_id
        WHERE a.id = achievements.aquarium_id
        AND (c.partner_one_id = auth.uid() OR c.partner_two_id = auth.uid())
    )
);

CREATE POLICY "Partners can view theme unlocks"
ON public.theme_unlocks FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.aquariums a
        JOIN public.couples c ON c.id = a.couple_id
        WHERE a.id = theme_unlocks.aquarium_id
        AND (c.partner_one_id = auth.uid() OR c.partner_two_id = auth.uid())
    )
);

-- ====================================================================
-- ATOMIC STORED PROCEDURES (Database Functions)
-- ====================================================================

-- Function 1: Claim Daily Pellet (Atomic + Idempotent)
CREATE OR REPLACE FUNCTION public.claim_daily_pellet(
    p_aquarium_id UUID,
    p_user_id UUID,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today DATE := (now() AT TIME ZONE 'UTC')::DATE;
    v_already_claimed BOOLEAN;
    v_new_balance INT;
    v_new_xp INT;
    v_new_level INT;
BEGIN
    -- Check if already claimed today
    SELECT EXISTS (
        SELECT 1 FROM public.daily_claims
        WHERE aquarium_id = p_aquarium_id AND user_id = p_user_id AND claim_date = v_today
    ) INTO v_already_claimed;

    IF v_already_claimed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sudah diklaim hari ini');
    END IF;

    -- Record daily claim
    INSERT INTO public.daily_claims (aquarium_id, user_id, claim_date)
    VALUES (p_aquarium_id, p_user_id, v_today);

    -- Record transaction
    INSERT INTO public.pellet_transactions (aquarium_id, actor_id, transaction_type, amount, idempotency_key, note)
    VALUES (p_aquarium_id, p_user_id, 'daily_claim', 1, p_idempotency_key, 'Daily login reward (+1 pellet, +50 XP)');

    -- Update aquarium pellet balance and grant 50 XP
    UPDATE public.aquariums
    SET 
        pellet_balance = pellet_balance + 1,
        current_xp = current_xp + 50,
        updated_at = now()
    WHERE id = p_aquarium_id
    RETURNING pellet_balance, current_xp, current_level INTO v_new_balance, v_new_xp, v_new_level;

    -- Check level up calculation (every 100 XP * level)
    IF v_new_xp >= (v_new_level * 100) AND v_new_level < 500 THEN
        v_new_level := v_new_level + 1;
        UPDATE public.aquariums
        SET current_level = v_new_level, updated_at = now()
        WHERE id = p_aquarium_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'pellet_balance', v_new_balance,
        'current_xp', v_new_xp,
        'current_level', v_new_level,
        'reward_pellets', 1,
        'reward_xp', 50
    );
END;
$$;

-- Function 2: Feed Fish (Deducts Pellet, Adds XP, Evolves Levels Atomically)
CREATE OR REPLACE FUNCTION public.feed_fish(
    p_aquarium_id UUID,
    p_user_id UUID,
    p_pellets_to_feed INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance INT;
    v_current_xp INT;
    v_current_level INT;
    v_xp_gain INT := p_pellets_to_feed * 20; -- 20 XP per pellet
    v_xp_needed INT;
    v_idempotency TEXT := 'feed_' || gen_random_uuid();
    v_leveled_up BOOLEAN := false;
BEGIN
    SELECT pellet_balance, current_xp, current_level 
    INTO v_balance, v_current_xp, v_current_level
    FROM public.aquariums
    WHERE id = p_aquarium_id
    FOR UPDATE;

    IF v_balance < p_pellets_to_feed THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pelet tidak mencukupi');
    END IF;

    -- Deduct balance & add XP
    v_balance := v_balance - p_pellets_to_feed;
    v_current_xp := v_current_xp + v_xp_gain;
    
    -- Level evolution check
    v_xp_needed := v_current_level * 80;
    WHILE v_current_xp >= v_xp_needed AND v_current_level < 500 LOOP
        v_current_xp := v_current_xp - v_xp_needed;
        v_current_level := v_current_level + 1;
        v_leveled_up := true;
        v_xp_needed := v_current_level * 80;
    END LOOP;

    -- Update aquarium
    UPDATE public.aquariums
    SET 
        pellet_balance = v_balance,
        current_xp = v_current_xp,
        current_level = v_current_level,
        updated_at = now()
    WHERE id = p_aquarium_id;

    -- Record transaction
    INSERT INTO public.pellet_transactions (aquarium_id, actor_id, transaction_type, amount, idempotency_key, note)
    VALUES (p_aquarium_id, p_user_id, 'feed', -p_pellets_to_feed, v_idempotency, 'Feeding fish');

    RETURN jsonb_build_object(
        'success', true,
        'pellet_balance', v_balance,
        'current_xp', v_current_xp,
        'current_level', v_current_level,
        'leveled_up', v_leveled_up
    );
END;
$$;

-- Function 3: Claim Secret Interaction Pellet
CREATE OR REPLACE FUNCTION public.claim_secret_pellet(
    p_aquarium_id UUID,
    p_user_id UUID,
    p_interaction_type TEXT,
    p_amount INT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_balance INT;
BEGIN
    -- Check idempotency
    IF EXISTS (SELECT 1 FROM public.pellet_transactions WHERE idempotency_key = p_idempotency_key) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaksi ini sudah diproses');
    END IF;

    -- Record transaction
    INSERT INTO public.pellet_transactions (aquarium_id, actor_id, transaction_type, amount, idempotency_key, note)
    VALUES (p_aquarium_id, p_user_id, p_interaction_type, p_amount, p_idempotency_key, 'Secret romantic interaction reward');

    -- Update aquarium balance and award +30 XP
    UPDATE public.aquariums
    SET 
        pellet_balance = pellet_balance + p_amount,
        current_xp = current_xp + (p_amount * 15),
        updated_at = now()
    WHERE id = p_aquarium_id
    RETURNING pellet_balance INTO v_new_balance;

    RETURN jsonb_build_object(
        'success', true,
        'pellet_balance', v_new_balance,
        'reward_pellets', p_amount
    );
END;
$$;

-- Function 4: Read Bubble Message (Only Recipient Can Mark Read)
CREATE OR REPLACE FUNCTION public.read_bubble_message(
    p_message_id UUID,
    p_reader_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_msg public.bubble_messages%ROWTYPE;
BEGIN
    SELECT * INTO v_msg
    FROM public.bubble_messages
    WHERE id = p_message_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pesan tidak ditemukan');
    END IF;

    IF v_msg.recipient_id != p_reader_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Hanya penerima yang berhak membuka pesan ini');
    END IF;

    UPDATE public.bubble_messages
    SET status = 'read', read_at = now()
    WHERE id = p_message_id;

    -- Grant bonus XP to the aquarium for opening a romantic message
    UPDATE public.aquariums
    SET current_xp = current_xp + 25, updated_at = now()
    WHERE id = v_msg.aquarium_id;

    RETURN jsonb_build_object(
        'success', true,
        'message_id', p_message_id,
        'read_at', now()
    );
END;
$$;

-- Enable Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.aquariums;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bubble_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pellet_transactions;

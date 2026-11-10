'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AquariumData, 
  BubbleMessage, 
  Couple, 
  FishRole, 
  PelletTransaction, 
  UserProfile,
  TransactionType,
  MessageCategory,
  DayTimeMode,
  SecretClaimRequest
} from '@/types/aquarium';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { getRequiredXpForNextLevel, SECRET_REWARDS } from '@/lib/level-system/levelConfig';
import { playFeedSound, playBubblePopSound, playMilestoneSound, playCapsuleUnlockSound, playDualTapResonanceSound } from '@/lib/audio/soundEffects';

const STORAGE_KEY = 'candut_repa_ocean_state_v4';
const ROLE_STORAGE_KEY = 'candut_repa_active_role';
const DAY_TIME_STORAGE_KEY = 'candut_saridut_daytime_mode';

// Deterministic UUIDs matching Supabase database
export const CANDUT_ID = '00000000-0000-0000-0000-000000000001';
export const REPA_ID = '00000000-0000-0000-0000-000000000002';
export const COUPLE_ID = '00000000-0000-0000-0000-000000000010';
export const AQUARIUM_ID = '00000000-0000-0000-0000-000000000100';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const encodeReplyInMessage = (
  text: string, 
  replyToSender: string | null | undefined, 
  replyToMessage: string | null | undefined
): string => {
  if (!replyToMessage) return text;
  const meta = JSON.stringify({
    s: replyToSender || '',
    m: replyToMessage.slice(0, 160),
  });
  return `<!--reply:${encodeURIComponent(meta)}-->${text}`;
};

export const parseReplyMetadata = (rawMsg: BubbleMessage): BubbleMessage => {
  let text = rawMsg.message || '';
  let replySender = rawMsg.reply_to_sender_name || null;
  let replyText = rawMsg.reply_to_message || null;

  const match = text.match(/<!--reply:(.*?)-->/);
  if (match && match[1]) {
    try {
      const decoded = JSON.parse(decodeURIComponent(match[1]));
      if (decoded.s && !replySender) replySender = decoded.s;
      if (decoded.m && !replyText) replyText = decoded.m;
      text = text.replace(match[0], '');
    } catch (_) {
      try {
        const decoded = JSON.parse(match[1]);
        if (decoded.s && !replySender) replySender = decoded.s;
        if (decoded.m && !replyText) replyText = decoded.m;
        text = text.replace(match[0], '');
      } catch (_) {}
    }
  }

  return {
    ...rawMsg,
    message: text,
    reply_to_sender_name: replySender,
    reply_to_message: replyText,
  };
};

export const sanitizeAndFilterMessages = (msgs: BubbleMessage[]): BubbleMessage[] => {
  const now = Date.now();
  return msgs
    .filter((m) => {
      // If it's a locked time capsule, keep it safely preserved until unlocked
      if (m.is_capsule && m.unlock_at) {
        const unlockTime = new Date(m.unlock_at).getTime();
        if (!isNaN(unlockTime) && unlockTime > now) {
          return true; // Still locked in the deep ocean, preserve it!
        }
        // If unlocked, retain for 3 days from unlock time
        const baseTime = !isNaN(unlockTime) ? unlockTime : new Date(m.created_at).getTime();
        return isNaN(baseTime) || now - baseTime <= THREE_DAYS_MS;
      }

      if (!m.created_at) return true;
      const t = new Date(m.created_at).getTime();
      return isNaN(t) || now - t <= THREE_DAYS_MS;
    })
    .map((m) => {
      const parsed = parseReplyMetadata(m);
      const isRepa = parsed.sender_role === 'repa' || (parsed.sender_name && parsed.sender_name.toLowerCase().includes('repa'));
      return {
        ...parsed,
        sender_name: isRepa ? 'Saridut' : parsed.sender_name,
      };
    });
};

export const getMilestonePelletBonus = (level: number): number => {
  if (level === 500) return 50;
  if (level === 400) return 25;
  if (level === 300) return 20;
  if (level === 200) return 15;
  if (level === 100) return 10;
  return 0;
};

const DEFAULT_CANDUT: UserProfile = {
  id: CANDUT_ID,
  email: 'candut@ocean.love',
  display_name: 'Candut',
  avatar_url: '',
  partner_role: 'candut',
  created_at: '2026-01-01T00:00:00Z',
};

const DEFAULT_REPA: UserProfile = {
  id: REPA_ID,
  email: 'saridut@ocean.love',
  display_name: 'Saridut',
  avatar_url: '',
  partner_role: 'repa',
  created_at: '2026-01-01T00:00:00Z',
};

const DEFAULT_COUPLE: Couple = {
  id: COUPLE_ID,
  partner_one_id: CANDUT_ID,
  partner_two_id: REPA_ID,
  invitation_code: 'OCEAN-LOVE7',
  anniversary_date: '2024-02-14',
  created_at: '2026-01-01T00:00:00Z',
  partner_one: DEFAULT_CANDUT,
  partner_two: DEFAULT_REPA,
};

const DEFAULT_AQUARIUM: AquariumData = {
  id: AQUARIUM_ID,
  couple_id: COUPLE_ID,
  current_level: 1,
  current_xp: 25,
  pellet_balance: 5,
  active_theme: 'ocean-dream',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export interface DroppedPellet {
  id: string;
  x: number;
  y: number;
  vy: number;
  eaten: boolean;
}

export function useAquariumStore() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_CANDUT);
  const [couple, setCouple] = useState<Couple>(DEFAULT_COUPLE);
  const [aquarium, setAquarium] = useState<AquariumData>(DEFAULT_AQUARIUM);
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [transactions, setTransactions] = useState<PelletTransaction[]>([]);
  const [lastClaimDate, setLastClaimDate] = useState<string>('');
  const [droppedPellets, setDroppedPellets] = useState<DroppedPellet[]>([]);
  const [milestoneCelebration, setMilestoneCelebration] = useState<number | null>(null);
  const [dayTimeMode, setDayTimeModeState] = useState<DayTimeMode>('auto');
  const [secretCooldowns, setSecretCooldowns] = useState<Record<string, number>>({});
  const [isPartnerOnline, setIsPartnerOnline] = useState<boolean>(false);
  const [remoteTap, setRemoteTap] = useState<{ x: number; y: number; role: FishRole; time: number } | null>(null);
  const [pendingClaims, setPendingClaims] = useState<SecretClaimRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const realtimeChannelRef = useRef<any>(null);

  // 1. Initialize Role & Clean Legacy State on Client Mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect role from URL query param (?role=saridut, ?role=repa, etc.) or saved localStorage
    const params = new URLSearchParams(window.location.search);
    const roleParam = (params.get('role') || params.get('as') || '').toLowerCase();
    const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);
    const savedDay = localStorage.getItem(DAY_TIME_STORAGE_KEY) as DayTimeMode;

    if (savedDay && ['auto', 'dawn', 'day', 'sunset', 'night'].includes(savedDay)) {
      setDayTimeModeState(savedDay);
    }

    if (roleParam === 'saridut' || roleParam === 'repa' || (!roleParam && (savedRole === 'saridut' || savedRole === 'repa'))) {
      setCurrentUser(DEFAULT_REPA);
      localStorage.setItem(ROLE_STORAGE_KEY, 'repa');
    } else {
      setCurrentUser(DEFAULT_CANDUT);
      localStorage.setItem(ROLE_STORAGE_KEY, 'candut');
    }

    try {
      // Clear legacy storage keys with incompatible string IDs
      ['candut_repa_ocean_state_v1', 'candut_repa_ocean_state_v2', 'candut_repa_ocean_state_v3'].forEach((k) => {
        try { localStorage.removeItem(k); } catch (_) {}
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.aquarium && parsed.aquarium.id === AQUARIUM_ID) {
          setAquarium(parsed.aquarium);
        }
        if (Array.isArray(parsed.messages)) {
          setMessages(sanitizeAndFilterMessages(parsed.messages));
        }
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.lastClaimDate) setLastClaimDate(parsed.lastClaimDate);
        if (parsed.secretCooldowns) setSecretCooldowns(parsed.secretCooldowns);
      }
    } catch (e) {
      console.warn('Failed to parse saved ocean state:', e);
    }

    setIsLoaded(true);
  }, []);

  // 2. Initial Fetch from Cloud Supabase & Realtime WebSocket Channel (Strict 7-Day Window)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    const fetchInitialData = async () => {
      try {
        const { data: aquaData, error: aquaErr } = await client
          .from('aquariums')
          .select('*')
          .eq('id', AQUARIUM_ID)
          .maybeSingle();

        if (aquaData && !aquaErr) {
          setAquarium(aquaData as AquariumData);
        }

        const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS).toISOString();
        const { data: msgData, error: msgErr } = await client
          .from('bubble_messages')
          .select('*')
          .eq('aquarium_id', AQUARIUM_ID)
          .gte('created_at', threeDaysAgo)
          .order('created_at', { ascending: false });

        if (msgData && !msgErr) {
          setMessages(sanitizeAndFilterMessages(msgData as BubbleMessage[]));
        }

        // Auto-cleanup expired messages older than 3 days in cloud
        client
          .from('bubble_messages')
          .delete()
          .lt('created_at', threeDaysAgo)
          .then(() => {});
      } catch (err) {
        console.warn('Supabase initial fetch warning:', err);
      }
    };

    fetchInitialData();

    // Supabase Realtime WebSocket listener & Presence tracking
    const channel = client
      .channel('aquarium_couple_sync', {
        config: {
          presence: {
            key: currentUser.partner_role,
          },
        },
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'aquariums' },
        (payload) => {
          if (payload.new && (payload.new as AquariumData).id === AQUARIUM_ID) {
            setAquarium(payload.new as AquariumData);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bubble_messages' },
        (payload) => {
          const rawMsg = payload.new as BubbleMessage;
          if (rawMsg && rawMsg.aquarium_id === AQUARIUM_ID) {
            const [cleaned] = sanitizeAndFilterMessages([rawMsg]);
            if (cleaned) {
              setMessages((prev) => sanitizeAndFilterMessages([cleaned, ...prev.filter((m) => m.id !== cleaned.id)]));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bubble_messages' },
        (payload) => {
          const rawUpdated = payload.new as BubbleMessage;
          if (rawUpdated && rawUpdated.aquarium_id === AQUARIUM_ID) {
            const [cleaned] = sanitizeAndFilterMessages([rawUpdated]);
            if (cleaned) {
              setMessages((prev) => sanitizeAndFilterMessages(prev.map((m) => (m.id === cleaned.id ? cleaned : m))));
            }
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const partnerRole = currentUser.partner_role === 'candut' ? 'repa' : 'candut';
        const partnerPresences = state[partnerRole] as any[];
        setIsPartnerOnline(Boolean(partnerPresences && partnerPresences.length > 0));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        const partnerRole = currentUser.partner_role === 'candut' ? 'repa' : 'candut';
        if (key === partnerRole) {
          setIsPartnerOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        const partnerRole = currentUser.partner_role === 'candut' ? 'repa' : 'candut';
        if (key === partnerRole) {
          const state = channel.presenceState();
          const partnerPresences = state[partnerRole] as any[];
          setIsPartnerOnline(Boolean(partnerPresences && partnerPresences.length > 0));
        }
      })
      .on('broadcast', { event: 'tap_glass' }, (payload) => {
        if (payload?.payload && payload.payload.role !== currentUser.partner_role) {
          setRemoteTap({
            x: payload.payload.x,
            y: payload.payload.y,
            role: payload.payload.role,
            time: Date.now(),
          });
        }
      })
      .on('broadcast', { event: 'secret_claim_update' }, (payload) => {
        if (payload?.payload) {
          const claim = payload.payload as SecretClaimRequest;
          if (claim.status === 'approved') {
            fetchInitialData();
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            role: currentUser.partner_role,
            online_at: new Date().toISOString(),
          });
        }
      });

    realtimeChannelRef.current = channel;

    return () => {
      realtimeChannelRef.current = null;
      client.removeChannel(channel);
    };
  }, [currentUser.partner_role]);

  // 3. Bulletproof Background Cloud Re-Sync (Every 2.5s + Instant on Window Focus)
  // Ensures two mobile phones are 100% synchronized even if WebSockets sleep on mobile
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;

    const syncLatestFromCloud = async () => {
      try {
        const { data: aquaData } = await client
          .from('aquariums')
          .select('*')
          .eq('id', AQUARIUM_ID)
          .maybeSingle();

        if (aquaData) {
          setAquarium((prev) => {
            if (
              prev.pellet_balance !== aquaData.pellet_balance ||
              prev.current_xp !== aquaData.current_xp ||
              prev.current_level !== aquaData.current_level ||
              prev.active_theme !== aquaData.active_theme
            ) {
              return aquaData as AquariumData;
            }
            return prev;
          });
        }

        const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS).toISOString();
        const { data: msgData } = await client
          .from('bubble_messages')
          .select('*')
          .eq('aquarium_id', AQUARIUM_ID)
          .gte('created_at', threeDaysAgo)
          .order('created_at', { ascending: false });

        if (msgData) {
          setMessages(sanitizeAndFilterMessages(msgData as BubbleMessage[]));
        }
      } catch (err) {
        // Silent background sync
      }
    };

    const intervalTimer = setInterval(syncLatestFromCloud, 2500);

    const onFocusOrVisibility = () => {
      syncLatestFromCloud();
    };

    window.addEventListener('focus', onFocusOrVisibility);
    window.addEventListener('visibilitychange', onFocusOrVisibility);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener('focus', onFocusOrVisibility);
      window.removeEventListener('visibilitychange', onFocusOrVisibility);
    };
  }, []);

  // 3b. Extract pending secret claim requests from bubble messages
  useEffect(() => {
    const claims: SecretClaimRequest[] = [];
    messages.forEach((m) => {
      if (m.status === 'pending' && m.message && m.message.startsWith('__SECRET_CLAIM_REQ__:')) {
        try {
          const raw = m.message.replace('__SECRET_CLAIM_REQ__:', '');
          const parsed = JSON.parse(raw) as SecretClaimRequest;
          parsed.bubble_id = m.id;
          claims.push(parsed);
        } catch (_) {}
      }
    });
    setPendingClaims(claims);
  }, [messages]);

  // 4. Save to localStorage for instant local loading (Persist only within 7-day retention)
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          aquarium,
          messages: sanitizeAndFilterMessages(messages),
          transactions,
          lastClaimDate,
          secretCooldowns,
        })
      );
    } catch (e) {
      console.error('Failed to save ocean state:', e);
    }
  }, [aquarium, messages, transactions, lastClaimDate, secretCooldowns, isLoaded]);

  // Switch between Candut and Repa
  const switchPartner = useCallback((role: FishRole) => {
    const nextUser = role === 'candut' ? DEFAULT_CANDUT : DEFAULT_REPA;
    setCurrentUser(nextUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    }
  }, []);

  const partnerUser: UserProfile = currentUser.partner_role === 'candut' 
    ? DEFAULT_REPA 
    : DEFAULT_CANDUT;

  // Claim Daily Pellet (+1 Pellet, +50 XP)
  const claimDailyPellet = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const today = new Date().toISOString().split('T')[0];
    if (lastClaimDate === today) {
      return { success: false, message: 'Hadiah harian telah diklaim hari ini. Tersedia kembali esok hari.' };
    }

    const nextXp = aquarium.current_xp + 50;
    let nextLevel = aquarium.current_level;
    let remainingXp = nextXp;
    let requiredXp = getRequiredXpForNextLevel(nextLevel);

    while (remainingXp >= requiredXp && nextLevel < 500) {
      remainingXp -= requiredXp;
      nextLevel += 1;
      requiredXp = getRequiredXpForNextLevel(nextLevel);
    }

    let milestoneBonus = 0;
    if ([100, 200, 300, 400, 500].includes(nextLevel) && nextLevel !== aquarium.current_level) {
      milestoneBonus = getMilestonePelletBonus(nextLevel);
      setMilestoneCelebration(nextLevel);
      playMilestoneSound();
    }

    const nextAqua = {
      ...aquarium,
      pellet_balance: aquarium.pellet_balance + 1 + milestoneBonus,
      current_level: nextLevel,
      current_xp: remainingXp,
      updated_at: new Date().toISOString(),
    };

    setAquarium(nextAqua);
    setLastClaimDate(today);

    // Sync to Supabase cloud
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          await client
            .from('aquariums')
            .update({
              pellet_balance: nextAqua.pellet_balance,
              current_level: nextAqua.current_level,
              current_xp: nextAqua.current_xp,
              updated_at: nextAqua.updated_at,
            })
            .eq('id', AQUARIUM_ID);
        } catch (err) {
          console.error('Supabase claim error:', err);
        }
      })();
    }

    return { success: true, message: 'Berhasil mengklaim 1 pelet dan 50 XP harian.' };
  }, [lastClaimDate, aquarium]);

  // Feed Fish (Atomically deducts balance, adds XP, drops visual pellets, and syncs directly to Supabase)
  const feedFish = useCallback((count: number = 1): { success: boolean; message: string } => {
    if (aquarium.pellet_balance < count) {
      return { success: false, message: 'Saldo pelet tidak mencukupi. Klaim hadiah harian untuk menambah pelet.' };
    }

    playFeedSound();

    const newPellets: DroppedPellet[] = Array.from({ length: count }).map((_, i) => ({
      id: `pellet-${Date.now()}-${i}`,
      x: 35 + (i * 12) % 30,
      y: 10 + i * 4,
      vy: 1.4 + (i * 0.2),
      eaten: false,
    }));

    setDroppedPellets((prev) => [...prev, ...newPellets]);

    const xpGain = count * 20;
    const nextXp = aquarium.current_xp + xpGain;
    let nextLevel = aquarium.current_level;
    let remainingXp = nextXp;
    let requiredXp = getRequiredXpForNextLevel(nextLevel);

    while (remainingXp >= requiredXp && nextLevel < 500) {
      remainingXp -= requiredXp;
      nextLevel += 1;
      requiredXp = getRequiredXpForNextLevel(nextLevel);
    }

    let milestoneBonus = 0;
    if ([100, 200, 300, 400, 500].includes(nextLevel) && nextLevel !== aquarium.current_level) {
      milestoneBonus = getMilestonePelletBonus(nextLevel);
      setMilestoneCelebration(nextLevel);
      playMilestoneSound();
    }

    const nextAqua: AquariumData = {
      ...aquarium,
      pellet_balance: aquarium.pellet_balance - count + milestoneBonus,
      current_level: nextLevel,
      current_xp: remainingXp,
      updated_at: new Date().toISOString(),
    };

    setAquarium(nextAqua);

    // Live Sync Directly to Supabase so both phones update immediately!
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          await client
            .from('aquariums')
            .update({
              pellet_balance: nextAqua.pellet_balance,
              current_xp: nextAqua.current_xp,
              current_level: nextAqua.current_level,
              updated_at: nextAqua.updated_at,
            })
            .eq('id', AQUARIUM_ID);
        } catch (err) {
          console.warn('Feed fish sync error:', err);
        }
      })();
    }

    return { 
      success: true, 
      message: `Pakan berhasil diberikan (+${xpGain} XP).` 
    };
  }, [aquarium]);

  const consumePellet = useCallback((pelletId: string) => {
    setDroppedPellets((prev) => prev.filter((p) => p.id !== pelletId));
  }, []);

  const changeTheme = useCallback((themeId: string) => {
    const updatedTimestamp = new Date().toISOString();
    setAquarium((prev) => ({
      ...prev,
      active_theme: themeId,
      updated_at: updatedTimestamp,
    }));

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          await client
            .from('aquariums')
            .update({
              active_theme: themeId,
              updated_at: updatedTimestamp,
            })
            .eq('id', AQUARIUM_ID);
        } catch (err) {
          console.warn('Theme update error:', err);
        }
      })();
    }
  }, []);

  const setDayTimeMode = useCallback((mode: DayTimeMode) => {
    setDayTimeModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DAY_TIME_STORAGE_KEY, mode);
    }
  }, []);

  // Send Romantic Message Bubble, Time Capsule, or Voice Whisper
  const createBubbleMessage = useCallback((
    message: string, 
    bubble_color: string = 'bubble-rose',
    category: MessageCategory = 'love',
    extra?: {
      is_capsule?: boolean;
      unlock_at?: string | null;
      audio_url?: string | null;
      audio_duration?: number | null;
      reply_to_id?: string | null;
      reply_to_sender_name?: string | null;
      reply_to_message?: string | null;
    }
  ): { success: boolean; message: string } => {
    const trimmed = message.trim();
    if (!trimmed && !extra?.audio_url) {
      return { success: false, message: 'Pesan atau rekaman suara tidak boleh kosong.' };
    }

    const finalMessage = trimmed || (extra?.audio_url ? '🎙️ Bisikan Suara Bawah Air' : '');

    const isCandut = currentUser.partner_role === 'candut';
    const senderId = isCandut ? CANDUT_ID : REPA_ID;
    const recipientId = isCandut ? REPA_ID : CANDUT_ID;
    const senderName = isCandut ? 'Candut' : 'Saridut';
    const recipientName = isCandut ? 'Saridut' : 'Candut';
    const senderRole: FishRole = isCandut ? 'candut' : 'repa';

    const optimisticMsg: BubbleMessage = {
      id: `local-${Date.now()}`,
      aquarium_id: AQUARIUM_ID,
      sender_id: senderId,
      recipient_id: recipientId,
      sender_name: senderName,
      sender_role: senderRole,
      message: finalMessage,
      bubble_color,
      category,
      status: 'pending',
      x_pos: 20 + Math.floor(Math.random() * 60),
      y_pos: extra?.is_capsule ? 72 + Math.floor(Math.random() * 12) : 25 + Math.floor(Math.random() * 40),
      drift_speed: extra?.is_capsule ? 0.35 : 0.9 + Math.random() * 0.3,
      created_at: new Date().toISOString(),
      is_capsule: !!extra?.is_capsule,
      unlock_at: extra?.unlock_at || null,
      audio_url: extra?.audio_url || null,
      audio_duration: extra?.audio_duration || null,
      reply_to_id: extra?.reply_to_id || null,
      reply_to_sender_name: extra?.reply_to_sender_name || null,
      reply_to_message: extra?.reply_to_message || null,
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    // Live insert into Supabase cloud
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const encodedMessage = encodeReplyInMessage(
            finalMessage, 
            optimisticMsg.reply_to_sender_name, 
            optimisticMsg.reply_to_message
          );

          const payload: Record<string, any> = {
            aquarium_id: AQUARIUM_ID,
            sender_id: senderId,
            recipient_id: recipientId,
            sender_name: senderName,
            sender_role: senderRole,
            message: encodedMessage,
            bubble_color,
            category,
            status: 'pending',
            x_pos: optimisticMsg.x_pos,
            y_pos: optimisticMsg.y_pos,
            drift_speed: optimisticMsg.drift_speed,
            is_capsule: optimisticMsg.is_capsule,
            unlock_at: optimisticMsg.unlock_at,
            audio_url: optimisticMsg.audio_url,
            audio_duration: optimisticMsg.audio_duration,
            reply_to_id: optimisticMsg.reply_to_id,
            reply_to_sender_name: optimisticMsg.reply_to_sender_name,
            reply_to_message: optimisticMsg.reply_to_message,
          };

          let { data: insertedRow, error } = await client
            .from('bubble_messages')
            .insert([payload])
            .select()
            .single();

          // Fallback if table does not yet have reply_to columns
          if (error && (error.message?.includes('reply_to') || error.code === '42703')) {
            delete payload.reply_to_id;
            delete payload.reply_to_sender_name;
            delete payload.reply_to_message;
            const retry = await client
              .from('bubble_messages')
              .insert([payload])
              .select()
              .single();
            insertedRow = retry.data;
            error = retry.error;
          }

          if (insertedRow && !error) {
            // Replace optimistic local message with canonical row
            const [cleanRow] = sanitizeAndFilterMessages([insertedRow as BubbleMessage]);
            const targetRow = cleanRow || (insertedRow as BubbleMessage);
            setMessages((prev) => sanitizeAndFilterMessages([
              targetRow,
              ...prev.filter((m) => m.id !== optimisticMsg.id && m.id !== targetRow.id),
            ]));
          } else if (error) {
            console.error('Supabase message insert error:', error);
          }
        } catch (err) {
          console.error('Bubble message send error:', err);
        }
      })();
    }

    const isReply = !!extra?.reply_to_id;
    const notif = isReply
      ? `Balasan pesan berhasil dilepaskan untuk ${recipientName}.`
      : extra?.is_capsule 
      ? `Kapsul Waktu berhasil ditenggelamkan ke dasar samudera untuk ${recipientName}.`
      : extra?.audio_url 
      ? `Bisikan Suara berhasil dilepaskan untuk ${recipientName}.`
      : `Pesan gelembung berhasil dilepaskan untuk ${recipientName}.`;

    return { success: true, message: notif };
  }, [currentUser]);

  // Open / Pop Romantic Message Bubble (Strictly for intended recipient)
  const openBubbleMessage = useCallback((msgId: string): { 
    success: boolean; 
    message?: BubbleMessage; 
    error?: string; 
  } => {
    const target = messages.find((m) => m.id === msgId);
    if (!target) return { success: false, error: 'Gelembung tidak ditemukan.' };

    const isCandut = currentUser.partner_role === 'candut';
    const myId = isCandut ? CANDUT_ID : REPA_ID;

    if (target.recipient_id !== myId) {
      const recipientName = isCandut ? 'Saridut' : 'Candut';
      return { 
        success: false, 
        error: `Pesan ini ditujukan khusus untuk ${recipientName}. Hanya ${recipientName} yang dapat membukanya.` 
      };
    }

    // Check if time capsule is still locked
    if (target.is_capsule && target.unlock_at) {
      const unlockTime = new Date(target.unlock_at).getTime();
      if (!isNaN(unlockTime) && Date.now() < unlockTime) {
        return { 
          success: false, 
          error: 'Kapsul Waktu ini masih terkunci rapat di dasar samudera. Waktu terbukanya belum tiba.' 
        };
      }
    }

    if (target.is_capsule) {
      playCapsuleUnlockSound();
    } else {
      playBubblePopSound();
    }

    const readTimestamp = new Date().toISOString();

    const updatedMessages = messages.map((m) => {
      if (m.id === msgId) {
        return {
          ...m,
          status: 'read' as const,
          read_at: readTimestamp,
        };
      }
      return m;
    });

    setMessages(updatedMessages);

    // Grant +50 XP for time capsule, +25 XP for normal bubble message
    const xpReward = target.is_capsule ? 50 : 25;
    const nextXp = aquarium.current_xp + xpReward;
    let nextLevel = aquarium.current_level;
    let remainingXp = nextXp;
    let requiredXp = getRequiredXpForNextLevel(nextLevel);

    while (remainingXp >= requiredXp && nextLevel < 500) {
      remainingXp -= requiredXp;
      nextLevel += 1;
      requiredXp = getRequiredXpForNextLevel(nextLevel);
    }

    let milestoneBonus = 0;
    if ([100, 200, 300, 400, 500].includes(nextLevel) && nextLevel !== aquarium.current_level) {
      milestoneBonus = getMilestonePelletBonus(nextLevel);
      setMilestoneCelebration(nextLevel);
      playMilestoneSound();
    }

    setAquarium((prev) => ({
      ...prev,
      pellet_balance: prev.pellet_balance + milestoneBonus,
      current_level: nextLevel,
      current_xp: remainingXp,
      updated_at: readTimestamp,
    }));

    // Live update to Supabase
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          await client
            .from('bubble_messages')
            .update({
              status: 'read',
              read_at: readTimestamp,
            })
            .eq('id', msgId);

          await client
            .from('aquariums')
            .update({
              current_level: nextLevel,
              current_xp: remainingXp,
              updated_at: readTimestamp,
            })
            .eq('id', AQUARIUM_ID);
        } catch (err) {
          console.warn('Read message update error:', err);
        }
      })();
    }

    return { 
      success: true, 
      message: { ...target, status: 'read', read_at: readTimestamp } 
    };
  }, [messages, currentUser, aquarium]);

  // Broadcast local glass tap to partner's screen
  const sendTapBroadcast = useCallback((xPercent: number, yPercent: number) => {
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'tap_glass',
        payload: {
          x: xPercent,
          y: yPercent,
          role: currentUser.partner_role,
          time: Date.now(),
        },
      });
    }
  }, [currentUser.partner_role]);

  // Request Secret Interaction Claim (Two-Way Mutual Approval Anti-Cheat)
  const requestSecretClaim = useCallback(async (
    type: TransactionType,
    pellets: number,
    title: string
  ): Promise<{ success: boolean; message: string }> => {
    const now = Date.now();
    const lastClaim = secretCooldowns[type] || 0;
    const cooldownMs = 4 * 3600 * 1000;

    if (now - lastClaim < cooldownMs) {
      const waitHours = Math.ceil((cooldownMs - (now - lastClaim)) / 3600000);
      return {
        success: false,
        message: `Interaksi rahasia sedang istirahat. Dapat diajukan kembali dalam ${waitHours} jam.`
      };
    }

    // Check if there is already a pending claim for this interaction
    const isAlreadyPending = pendingClaims.some(
      (c) => c.reward_id === type && c.status === 'pending'
    );
    if (isAlreadyPending) {
      return {
        success: false,
        message: 'Klaim untuk interaksi ini sudah diajukan dan sedang menunggu konfirmasi pasangan.'
      };
    }

    const claimReq: SecretClaimRequest = {
      id: `claim-${Date.now()}`,
      reward_id: type,
      reward_title: title,
      pellets,
      requester_role: currentUser.partner_role,
      requester_name: currentUser.display_name,
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    const partnerName = currentUser.partner_role === 'candut' ? 'Saridut' : 'Candut';
    const rawPayload = `__SECRET_CLAIM_REQ__:${JSON.stringify(claimReq)}`;

    // Release as floating heart-lock bubble in aquarium
    createBubbleMessage(rawPayload, 'bubble-rose', 'love');

    // Broadcast realtime event
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'secret_claim_update',
        payload: claimReq,
      });
    }

    return {
      success: true,
      message: `Permintaan klaim "${title}" berhasil dikirim ke ${partnerName}. Hadiah akan masuk setelah dikonfirmasi! 💕`
    };
  }, [secretCooldowns, pendingClaims, currentUser, createBubbleMessage]);

  // Respond to Secret Interaction Claim (Partner approves or rejects)
  const respondSecretClaim = useCallback(async (
    requestId: string,
    approve: boolean
  ): Promise<{ success: boolean; message: string }> => {
    const claim = pendingClaims.find((c) => c.id === requestId);
    if (!claim) {
      return { success: false, message: 'Permintaan klaim tidak ditemukan atau sudah selesai diproses.' };
    }

    const bubble = messages.find(
      (m) => m.id === claim.bubble_id || (m.message && m.message.includes(requestId))
    );

    const now = Date.now();
    const readTimestamp = new Date().toISOString();

    if (approve) {
      const pellets = claim.pellets;
      const xpReward = pellets * 20;
      const nextXp = aquarium.current_xp + xpReward;
      let nextLevel = aquarium.current_level;
      let remainingXp = nextXp;
      let requiredXp = getRequiredXpForNextLevel(nextLevel);

      while (remainingXp >= requiredXp && nextLevel < 500) {
        remainingXp -= requiredXp;
        nextLevel += 1;
        requiredXp = getRequiredXpForNextLevel(nextLevel);
      }

      let milestoneBonus = 0;
      if ([100, 200, 300, 400, 500].includes(nextLevel) && nextLevel !== aquarium.current_level) {
        milestoneBonus = getMilestonePelletBonus(nextLevel);
        setMilestoneCelebration(nextLevel);
        playMilestoneSound();
      }

      const nextAqua = {
        ...aquarium,
        pellet_balance: aquarium.pellet_balance + pellets + milestoneBonus,
        current_level: nextLevel,
        current_xp: remainingXp,
        updated_at: readTimestamp,
      };

      setAquarium(nextAqua);
      setSecretCooldowns((prev) => ({ ...prev, [claim.reward_id]: now }));

      // Update bubble message to 'read'
      if (bubble) {
        setMessages((prev) =>
          prev.map((m) => (m.id === bubble.id ? { ...m, status: 'read', read_at: readTimestamp } : m))
        );
      }

      // Sync to Supabase
      if (isSupabaseConfigured && supabase) {
        const client = supabase;
        (async () => {
          try {
            await client.from('aquariums').update({
              pellet_balance: nextAqua.pellet_balance,
              current_level: nextAqua.current_level,
              current_xp: nextAqua.current_xp,
              updated_at: readTimestamp,
            }).eq('id', AQUARIUM_ID);

            if (bubble) {
              await client.from('bubble_messages').update({
                status: 'read',
                read_at: readTimestamp,
              }).eq('id', bubble.id);
            }
          } catch (err) {
            console.error('Approval sync error:', err);
          }
        })();
      }

      // Broadcast approval to partner
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'secret_claim_update',
          payload: { ...claim, status: 'approved' },
        });
      }

      playCapsuleUnlockSound();

      return {
        success: true,
        message: `Klaim "${claim.reward_title}" berhasil dikonfirmasi! +${pellets} Pelet dan +${xpReward} XP telah masuk ke akuarium kalian! 💕`
      };
    } else {
      // Rejected: mark bubble as read
      if (bubble) {
        setMessages((prev) =>
          prev.map((m) => (m.id === bubble.id ? { ...m, status: 'read', read_at: readTimestamp } : m))
        );
      }

      if (isSupabaseConfigured && supabase && bubble) {
        supabase.from('bubble_messages').update({
          status: 'read',
          read_at: readTimestamp,
        }).eq('id', bubble.id).then(() => {});
      }

      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'secret_claim_update',
          payload: { ...claim, status: 'rejected' },
        });
      }

      return {
        success: true,
        message: `Permintaan klaim "${claim.reward_title}" telah ditolak.`
      };
    }
  }, [pendingClaims, messages, aquarium]);

  // Backward compatibility: delegate to requestSecretClaim
  const claimSecretInteraction = useCallback(async (
    type: TransactionType,
    pellets: number,
    title: string
  ): Promise<{ success: boolean; message: string }> => {
    return requestSecretClaim(type, pellets, title);
  }, [requestSecretClaim]);

  const pairWithInviteCode = useCallback((code: string): { success: boolean; message: string } => {
    return { success: true, message: 'Akuarium Candut & Saridut sudah otomatis terhubung secara permanen.' };
  }, []);

  const updateProfile = useCallback((name: string, role: FishRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      display_name: name,
      partner_role: role,
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    }
  }, []);

  return {
    isLoaded,
    currentUser,
    partnerUser,
    couple,
    aquarium,
    messages,
    transactions,
    droppedPellets,
    lastClaimDate,
    milestoneCelebration,
    dayTimeMode,
    isPartnerOnline,
    remoteTap,
    pendingClaims,
    secretCooldowns,
    setDayTimeMode,
    setMilestoneCelebration,
    switchPartner,
    claimDailyPellet,
    claimSecretInteraction,
    requestSecretClaim,
    respondSecretClaim,
    sendTapBroadcast,
    feedFish,
    consumePellet,
    changeTheme,
    createBubbleMessage,
    openBubbleMessage,
    pairWithInviteCode,
    updateProfile,
  };
}

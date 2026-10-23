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
  MessageCategory
} from '@/types/aquarium';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { getRequiredXpForNextLevel } from '@/lib/level-system/levelConfig';
import { playFeedSound, playBubblePopSound, playMilestoneSound } from '@/lib/audio/soundEffects';

const STORAGE_KEY = 'candut_repa_ocean_state_v4';
const ROLE_STORAGE_KEY = 'candut_repa_active_role';

// Deterministic UUIDs matching Supabase database
export const CANDUT_ID = '00000000-0000-0000-0000-000000000001';
export const REPA_ID = '00000000-0000-0000-0000-000000000002';
export const COUPLE_ID = '00000000-0000-0000-0000-000000000010';
export const AQUARIUM_ID = '00000000-0000-0000-0000-000000000100';

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
  email: 'repa@ocean.love',
  display_name: 'Repa',
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
  const [secretCooldowns, setSecretCooldowns] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // 1. Initialize Role & Clean Legacy State on Client Mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect role from URL query param (?role=repa or ?as=repa) or saved localStorage
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') || params.get('as');
    const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);

    if (roleParam === 'repa' || (!roleParam && savedRole === 'repa')) {
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
          setMessages(parsed.messages);
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

  // 2. Initial Fetch from Cloud Supabase & Realtime WebSocket Channel
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

        const { data: msgData, error: msgErr } = await client
          .from('bubble_messages')
          .select('*')
          .eq('aquarium_id', AQUARIUM_ID)
          .order('created_at', { ascending: false });

        if (msgData && !msgErr) {
          setMessages(msgData as BubbleMessage[]);
        }
      } catch (err) {
        console.warn('Supabase initial fetch warning:', err);
      }
    };

    fetchInitialData();

    // Supabase Realtime WebSocket listener
    const channel = client
      .channel('aquarium_couple_sync')
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
          const newMsg = payload.new as BubbleMessage;
          if (newMsg && newMsg.aquarium_id === AQUARIUM_ID) {
            setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bubble_messages' },
        (payload) => {
          const updated = payload.new as BubbleMessage;
          if (updated && updated.aquarium_id === AQUARIUM_ID) {
            setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

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

        const { data: msgData } = await client
          .from('bubble_messages')
          .select('*')
          .eq('aquarium_id', AQUARIUM_ID)
          .order('created_at', { ascending: false });

        if (msgData) {
          setMessages(msgData as BubbleMessage[]);
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

  // 4. Save to localStorage for instant local loading
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          aquarium,
          messages,
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

    if ([100, 200, 300, 400, 500].includes(nextLevel) && nextLevel !== aquarium.current_level) {
      setMilestoneCelebration(nextLevel);
      playMilestoneSound();
    }

    const nextAqua = {
      ...aquarium,
      pellet_balance: aquarium.pellet_balance + 1,
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

  // Claim Secret Interaction Pellets (+2, +3, +4, +5 Pellets)
  const claimSecretInteraction = useCallback(async (
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
        message: `Interaksi rahasia sedang istirahat. Dapat dibuka kembali dalam ${waitHours} jam.` 
      };
    }

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

    if ([100, 200, 300, 400, 500].includes(nextLevel) && nextLevel !== aquarium.current_level) {
      setMilestoneCelebration(nextLevel);
      playMilestoneSound();
    }

    const nextAqua = {
      ...aquarium,
      pellet_balance: aquarium.pellet_balance + pellets,
      current_level: nextLevel,
      current_xp: remainingXp,
      updated_at: new Date().toISOString(),
    };

    setAquarium(nextAqua);
    setSecretCooldowns((prev) => ({ ...prev, [type]: now }));

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
          console.error('Supabase secret claim error:', err);
        }
      })();
    }

    return { 
      success: true, 
      message: `Interaksi tersimpan: +${pellets} pelet dan +${xpReward} XP diperoleh.` 
    };
  }, [secretCooldowns, aquarium]);

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

    if ([100, 200, 300, 400, 500].includes(nextLevel) && nextLevel !== aquarium.current_level) {
      setMilestoneCelebration(nextLevel);
      playMilestoneSound();
    }

    const nextAqua: AquariumData = {
      ...aquarium,
      pellet_balance: aquarium.pellet_balance - count,
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

  // Send Romantic Message Bubble (Inserts into Supabase with automatic DB UUID & broadcasts)
  const createBubbleMessage = useCallback((
    message: string, 
    bubble_color: string = 'bubble-rose',
    category: MessageCategory = 'love'
  ): { success: boolean; message: string } => {
    if (!message.trim()) {
      return { success: false, message: 'Pesan tidak boleh kosong.' };
    }

    const isCandut = currentUser.partner_role === 'candut';
    const senderId = isCandut ? CANDUT_ID : REPA_ID;
    const recipientId = isCandut ? REPA_ID : CANDUT_ID;
    const senderName = isCandut ? 'Candut' : 'Repa';
    const recipientName = isCandut ? 'Repa' : 'Candut';
    const senderRole: FishRole = isCandut ? 'candut' : 'repa';

    const optimisticMsg: BubbleMessage = {
      id: `local-${Date.now()}`,
      aquarium_id: AQUARIUM_ID,
      sender_id: senderId,
      recipient_id: recipientId,
      sender_name: senderName,
      sender_role: senderRole,
      message: message.trim(),
      bubble_color,
      category,
      status: 'pending',
      x_pos: 25 + Math.floor(Math.random() * 50),
      y_pos: 30 + Math.floor(Math.random() * 35),
      drift_speed: 0.9 + Math.random() * 0.3,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    // Live insert into Supabase cloud (PostgreSQL automatically generates canonical UUID)
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          const { data: insertedRow, error } = await client
            .from('bubble_messages')
            .insert([{
              aquarium_id: AQUARIUM_ID,
              sender_id: senderId,
              recipient_id: recipientId,
              sender_name: senderName,
              sender_role: senderRole,
              message: message.trim(),
              bubble_color,
              category,
              status: 'pending',
              x_pos: optimisticMsg.x_pos,
              y_pos: optimisticMsg.y_pos,
              drift_speed: optimisticMsg.drift_speed,
            }])
            .select()
            .single();

          if (insertedRow && !error) {
            // Replace optimistic local message with canonical row
            setMessages((prev) => [
              insertedRow as BubbleMessage,
              ...prev.filter((m) => m.id !== optimisticMsg.id && m.id !== (insertedRow as BubbleMessage).id),
            ]);
          } else if (error) {
            console.error('Supabase message insert error:', error);
          }
        } catch (err) {
          console.error('Bubble message send error:', err);
        }
      })();
    }

    return { success: true, message: `Pesan gelembung berhasil dilepaskan untuk ${recipientName}.` };
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
      const recipientName = isCandut ? 'Repa' : 'Candut';
      return { 
        success: false, 
        error: `Pesan ini ditujukan khusus untuk ${recipientName}. Hanya ${recipientName} yang dapat membukanya.` 
      };
    }

    playBubblePopSound();

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

    // Grant +25 XP to aquarium for opening a romantic message
    const nextXp = aquarium.current_xp + 25;
    let nextLevel = aquarium.current_level;
    let remainingXp = nextXp;
    let requiredXp = getRequiredXpForNextLevel(nextLevel);

    while (remainingXp >= requiredXp && nextLevel < 500) {
      remainingXp -= requiredXp;
      nextLevel += 1;
      requiredXp = getRequiredXpForNextLevel(nextLevel);
    }

    if ([100, 200, 300, 400, 500].includes(nextLevel) && nextLevel !== aquarium.current_level) {
      setMilestoneCelebration(nextLevel);
      playMilestoneSound();
    }

    setAquarium((prev) => ({
      ...prev,
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

  const pairWithInviteCode = useCallback((code: string): { success: boolean; message: string } => {
    return { success: true, message: 'Akuarium Candut & Repa sudah otomatis terhubung secara permanen.' };
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
    setMilestoneCelebration,
    switchPartner,
    claimDailyPellet,
    claimSecretInteraction,
    feedFish,
    consumePellet,
    changeTheme,
    createBubbleMessage,
    openBubbleMessage,
    pairWithInviteCode,
    updateProfile,
  };
}

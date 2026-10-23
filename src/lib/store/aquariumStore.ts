'use client';

import { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEY = 'candut_repa_ocean_state_v2';

const DEFAULT_CANDUT: UserProfile = {
  id: 'usr-candut-01',
  email: 'candut@ocean.love',
  display_name: 'Candut',
  avatar_url: '',
  partner_role: 'candut',
  created_at: new Date().toISOString(),
};

const DEFAULT_REPA: UserProfile = {
  id: 'usr-repa-02',
  email: 'repa@ocean.love',
  display_name: 'Repa',
  avatar_url: '',
  partner_role: 'repa',
  created_at: new Date().toISOString(),
};

const DEFAULT_COUPLE: Couple = {
  id: 'couple-candut-repa',
  partner_one_id: DEFAULT_CANDUT.id,
  partner_two_id: DEFAULT_REPA.id,
  invitation_code: 'OCEAN-LOVE7',
  anniversary_date: '2024-02-14',
  created_at: new Date().toISOString(),
  partner_one: DEFAULT_CANDUT,
  partner_two: DEFAULT_REPA,
};

const DEFAULT_AQUARIUM: AquariumData = {
  id: 'aqua-candut-repa-01',
  couple_id: DEFAULT_COUPLE.id,
  current_level: 1,
  current_xp: 25,
  pellet_balance: 5,
  active_theme: 'ocean-dream',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const INITIAL_MESSAGES: BubbleMessage[] = [
  {
    id: 'msg-seed-1',
    aquarium_id: DEFAULT_AQUARIUM.id,
    sender_id: DEFAULT_CANDUT.id,
    recipient_id: DEFAULT_REPA.id,
    sender_name: 'Candut',
    sender_role: 'candut',
    message: 'Selamat datang di samudera kecil kita, Repa. Semoga tempat ini selalu tenang untuk kita berdua saling menyapa dan bertumbuh bersama.',
    bubble_color: 'bubble-teal',
    category: 'love',
    status: 'pending',
    x_pos: 28,
    y_pos: 42,
    drift_speed: 1.1,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-seed-2',
    aquarium_id: DEFAULT_AQUARIUM.id,
    sender_id: DEFAULT_REPA.id,
    recipient_id: DEFAULT_CANDUT.id,
    sender_name: 'Repa',
    sender_role: 'repa',
    message: 'Candut, terima kasih sudah selalu ada dengan tenang di sisiku. Jangan lupa istirahat yang cukup hari ini ya.',
    bubble_color: 'bubble-rose',
    category: 'gratitude',
    status: 'pending',
    x_pos: 72,
    y_pos: 35,
    drift_speed: 0.9,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

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
  const [messages, setMessages] = useState<BubbleMessage[]>(INITIAL_MESSAGES);
  const [transactions, setTransactions] = useState<PelletTransaction[]>([]);
  const [lastClaimDate, setLastClaimDate] = useState<string>('');
  const [droppedPellets, setDroppedPellets] = useState<DroppedPellet[]>([]);
  const [milestoneCelebration, setMilestoneCelebration] = useState<number | null>(null);
  const [secretCooldowns, setSecretCooldowns] = useState<Record<string, number>>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Initialize and load persistent state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.aquarium) setAquarium(parsed.aquarium);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.lastClaimDate) setLastClaimDate(parsed.lastClaimDate);
        if (parsed.secretCooldowns) setSecretCooldowns(parsed.secretCooldowns);
        if (parsed.currentUser) setCurrentUser(parsed.currentUser);
        if (parsed.couple) setCouple(parsed.couple);
      }
    } catch (e) {
      console.warn('Failed to parse saved ocean state:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state updates
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
          currentUser,
          couple,
        })
      );
    } catch (e) {
      console.error('Failed to save ocean state:', e);
    }
  }, [aquarium, messages, transactions, lastClaimDate, secretCooldowns, currentUser, couple, isLoaded]);

  // Supabase Realtime synchronization listener (if enabled)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('aquarium_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'aquariums' },
        (payload) => {
          if (payload.new && (payload.new as AquariumData).id === aquarium.id) {
            setAquarium(payload.new as AquariumData);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bubble_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as BubbleMessage;
            setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as BubbleMessage;
            setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [aquarium.id]);

  // Switch between Candut and Repa
  const switchPartner = useCallback((role: FishRole) => {
    if (role === 'candut') {
      setCurrentUser(couple.partner_one || DEFAULT_CANDUT);
    } else {
      setCurrentUser(couple.partner_two || DEFAULT_REPA);
    }
  }, [couple]);

  const partnerUser: UserProfile = currentUser.partner_role === 'candut' 
    ? (couple.partner_two || DEFAULT_REPA) 
    : (couple.partner_one || DEFAULT_CANDUT);

  // Claim Daily Pellet (+1 Pellet, +50 XP, server-enforced date check)
  const claimDailyPellet = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const today = new Date().toISOString().split('T')[0];
    if (lastClaimDate === today) {
      return { success: false, message: 'Hadiah harian telah diklaim hari ini. Tersedia kembali esok hari.' };
    }

    const tx: PelletTransaction = {
      id: `tx-daily-${Date.now()}`,
      aquarium_id: aquarium.id,
      actor_id: currentUser.id,
      transaction_type: 'daily_claim',
      amount: 1,
      idempotency_key: `daily-${today}-${currentUser.id}`,
      note: 'Login harian (+1 pelet, +50 XP)',
      created_at: new Date().toISOString(),
    };

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

    setAquarium((prev) => ({
      ...prev,
      pellet_balance: prev.pellet_balance + 1,
      current_level: nextLevel,
      current_xp: remainingXp,
      updated_at: new Date().toISOString(),
    }));

    setTransactions((prev) => [tx, ...prev]);
    setLastClaimDate(today);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.rpc('claim_daily_pellet', {
          p_aquarium_id: aquarium.id,
          p_user_id: currentUser.id,
          p_idempotency_key: tx.idempotency_key,
        });
      } catch (err) {
        console.error('Supabase claim error:', err);
      }
    }

    return { success: true, message: 'Berhasil mengklaim 1 pelet dan 50 XP harian.' };
  }, [lastClaimDate, aquarium, currentUser]);

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

    const tx: PelletTransaction = {
      id: `tx-sec-${Date.now()}`,
      aquarium_id: aquarium.id,
      actor_id: currentUser.id,
      transaction_type: type,
      amount: pellets,
      idempotency_key: `secret-${type}-${now}`,
      note: `${title} (+${pellets} pelet)`,
      created_at: new Date().toISOString(),
    };

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

    setAquarium((prev) => ({
      ...prev,
      pellet_balance: prev.pellet_balance + pellets,
      current_level: nextLevel,
      current_xp: remainingXp,
      updated_at: new Date().toISOString(),
    }));

    setTransactions((prev) => [tx, ...prev]);
    setSecretCooldowns((prev) => ({ ...prev, [type]: now }));

    return { 
      success: true, 
      message: `Interaksi tersimpan: +${pellets} pelet dan +${xpReward} XP diperoleh.` 
    };
  }, [secretCooldowns, aquarium, currentUser]);

  // Feed Fish (Atomically deducts balance and adds XP)
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

    const tx: PelletTransaction = {
      id: `tx-feed-${Date.now()}`,
      aquarium_id: aquarium.id,
      actor_id: currentUser.id,
      transaction_type: 'feed',
      amount: -count,
      idempotency_key: `feed-${Date.now()}`,
      note: `Pemberian makan (${count} pelet)`,
      created_at: new Date().toISOString(),
    };

    setAquarium((prev) => ({
      ...prev,
      pellet_balance: prev.pellet_balance - count,
      current_level: nextLevel,
      current_xp: remainingXp,
      updated_at: new Date().toISOString(),
    }));

    setTransactions((prev) => [tx, ...prev]);

    return { 
      success: true, 
      message: `Pakan berhasil diberikan (+${xpGain} XP).` 
    };
  }, [aquarium, currentUser]);

  const consumePellet = useCallback((pelletId: string) => {
    setDroppedPellets((prev) => prev.filter((p) => p.id !== pelletId));
  }, []);

  const changeTheme = useCallback((themeId: string) => {
    setAquarium((prev) => ({
      ...prev,
      active_theme: themeId,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  // Send Romantic Message Bubble
  const createBubbleMessage = useCallback((
    message: string, 
    bubble_color: string = 'bubble-rose',
    category: MessageCategory = 'love'
  ): { success: boolean; message: string } => {
    if (!message.trim()) {
      return { success: false, message: 'Pesan tidak boleh kosong.' };
    }

    const recipient = partnerUser;

    const newMsg: BubbleMessage = {
      id: `msg-${Date.now()}`,
      aquarium_id: aquarium.id,
      sender_id: currentUser.id,
      recipient_id: recipient.id,
      sender_name: currentUser.display_name,
      sender_role: currentUser.partner_role,
      message: message.trim(),
      bubble_color,
      category,
      status: 'pending',
      x_pos: 25 + ((Date.now() % 50)),
      y_pos: 35 + ((Date.now() % 30)),
      drift_speed: 0.9,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [newMsg, ...prev]);

    if (isSupabaseConfigured && supabase) {
      Promise.resolve(supabase.from('bubble_messages').insert([newMsg])).catch(console.error);
    }

    return { success: true, message: 'Pesan gelembung berhasil dilepaskan ke aquarium.' };
  }, [aquarium.id, currentUser, partnerUser]);

  // Open / Pop Romantic Message Bubble (Strictly for intended recipient)
  const openBubbleMessage = useCallback((msgId: string): { 
    success: boolean; 
    message?: BubbleMessage; 
    error?: string; 
  } => {
    const target = messages.find((m) => m.id === msgId);
    if (!target) return { success: false, error: 'Gelembung tidak ditemukan.' };

    if (target.recipient_id !== currentUser.id) {
      const recipientName = target.recipient_id === DEFAULT_REPA.id ? 'Repa' : 'Candut';
      return { 
        success: false, 
        error: `Pesan ini ditujukan untuk ${recipientName}. Hanya penerima yang dapat membuka gelembung ini.` 
      };
    }

    playBubblePopSound();

    const updatedMessages = messages.map((m) => {
      if (m.id === msgId) {
        return {
          ...m,
          status: 'read' as const,
          read_at: new Date().toISOString(),
        };
      }
      return m;
    });

    setMessages(updatedMessages);

    const nextXp = aquarium.current_xp + 25;
    let nextLevel = aquarium.current_level;
    let remainingXp = nextXp;
    let requiredXp = getRequiredXpForNextLevel(nextLevel);

    while (remainingXp >= requiredXp && nextLevel < 500) {
      remainingXp -= requiredXp;
      nextLevel += 1;
      requiredXp = getRequiredXpForNextLevel(nextLevel);
    }

    setAquarium((prev) => ({
      ...prev,
      current_level: nextLevel,
      current_xp: remainingXp,
      updated_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured && supabase) {
      Promise.resolve(
        supabase.rpc('read_bubble_message', {
          p_message_id: msgId,
          p_reader_id: currentUser.id,
        })
      ).catch(console.error);
    }

    return { 
      success: true, 
      message: { ...target, status: 'read', read_at: new Date().toISOString() } 
    };
  }, [messages, currentUser, aquarium]);

  const pairWithInviteCode = useCallback((code: string): { success: boolean; message: string } => {
    if (code.trim().toUpperCase() === couple.invitation_code.toUpperCase()) {
      return { success: true, message: 'Sudah terhubung dengan pasangan.' };
    }
    setCouple((prev) => ({
      ...prev,
      invitation_code: code.trim().toUpperCase(),
    }));
    return { success: true, message: `Berhasil menghubungkan akuarium dengan kode ${code.toUpperCase()}.` };
  }, [couple]);

  const updateProfile = useCallback((name: string, role: FishRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      display_name: name,
      partner_role: role,
    }));
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

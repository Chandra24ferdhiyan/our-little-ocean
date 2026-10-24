'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAquarium } from '@/lib/store/AquariumContext';
import { BubbleMessage } from '@/types/aquarium';
import { 
  Heart, 
  Sparkles, 
  Clock, 
  LockKeyhole, 
  MessageCircle, 
  Hourglass,
  Volume2,
  X,
  Lock,
  Unlock
} from 'lucide-react';

interface FloatingBubblesProps {
  onOpenBubble: (bubble: BubbleMessage) => void;
}

export function FloatingBubbles({ onOpenBubble }: FloatingBubblesProps) {
  const { messages, currentUser, openBubbleMessage } = useAquarium();
  const [blockedHint, setBlockedHint] = useState<{ id: string; text: string } | null>(null);
  const [lockedCapsuleView, setLockedCapsuleView] = useState<BubbleMessage | null>(null);
  const [now, setNow] = useState<number>(0);

  // Ticker for live time capsule countdown
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pendingBubbles = messages.filter((m) => m.status === 'pending');

  const handleBubbleClick = (e: React.MouseEvent, msg: BubbleMessage) => {
    e.stopPropagation();

    // 1. Time Capsule Check
    if (msg.is_capsule && msg.unlock_at) {
      const unlockTime = new Date(msg.unlock_at).getTime();
      if (!isNaN(unlockTime) && now < unlockTime) {
        // Still locked: show the intimate countdown modal to either partner
        setLockedCapsuleView(msg);
        return;
      }
    }

    // 2. Recipient Identity Lock Check
    if (msg.recipient_id !== currentUser.id) {
      const partnerName = msg.sender_role === 'candut' ? 'Saridut' : 'Candut';
      setBlockedHint({
        id: msg.id,
        text: `Pesan ditujukan khusus untuk ${partnerName}. Tunggu pasanganmu membukanya.`,
      });
      setTimeout(() => setBlockedHint(null), 3000);
      return;
    }

    // 3. Open Message
    const res = openBubbleMessage(msg.id);
    if (res.success && res.message) {
      onOpenBubble(res.message);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'love':
        return <img src="/icons/heart_gem.png" alt="Cinta" className="w-5 h-5 object-contain" />;
      case 'gratitude':
        return <Sparkles className="w-4 h-4 text-[#4A6B82]" />;
      case 'memory':
        return <Clock className="w-4 h-4 text-[#EAA77D]" />;
      case 'promise':
        return <img src="/icons/heart_lock.png" alt="Janji" className="w-4 h-4 object-contain" />;
      default:
        return <img src="/icons/chat_bubble.png" alt="Pesan" className="w-4 h-4 object-contain" />;
    }
  };

  // Helper to format remaining time
  const formatRemainingTime = (targetIso: string) => {
    const currentMs = now > 0 ? now : (typeof window !== 'undefined' ? Date.now() : 0);
    const diff = Math.max(0, new Date(targetIso).getTime() - currentMs);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isDone: diff <= 0 };
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {pendingBubbles.map((msg, index) => {
        const isRecipient = msg.recipient_id === currentUser.id;
        const isFromCandut = msg.sender_role === 'candut';
        const senderDisplayName = isFromCandut
          ? 'Candut'
          : (msg.sender_role === 'repa' || (msg.sender_name && msg.sender_name.toLowerCase().includes('repa')) ? 'Saridut' : (msg.sender_name || 'Saridut'));

        const isTimeCapsule = !!msg.is_capsule;
        const isCapsuleLocked = isTimeCapsule && msg.unlock_at && (now > 0 ? now < new Date(msg.unlock_at).getTime() : true);
        const hasVoiceNote = !!msg.audio_url;

        const floatDelay = (index * 0.8) % 3;
        const floatDuration = isTimeCapsule ? 6.5 : (4.5 + (index % 2));

        return (
          <div
            key={msg.id}
            style={{
              left: `${msg.x_pos}%`,
              top: `${msg.y_pos}%`,
              animation: `editorialBubbleFloat ${floatDuration}s ease-in-out ${floatDelay}s infinite alternate`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
            onClick={(e) => handleBubbleClick(e, msg)}
          >
            {/* Iridescent Realistic Glass Bubble OR Time Capsule Bottle */}
            {isTimeCapsule ? (
              <div className="relative flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-110">
                {/* Ambient underwater glow */}
                <div
                  className={`absolute -inset-1 rounded-full blur-xs transition-opacity ${
                    isCapsuleLocked ? 'bg-amber-400/25' : 'bg-emerald-400/35 animate-pulse'
                  }`}
                />

                {/* 3D Time Capsule Icon */}
                <div className="w-12 h-12 md:w-14 md:h-14 relative flex items-center justify-center">
                  <img 
                    src="/icons/time_capsule.png" 
                    alt="Kapsul Waktu" 
                    className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" 
                  />
                  {isCapsuleLocked ? (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white p-1 rounded-full shadow-md border border-white/70">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-1 rounded-full shadow-md border border-white/70 animate-bounce">
                      <Unlock className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-bold tracking-wider uppercase text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] mt-0.5 px-2 py-0.5 rounded-full bg-[#182C3A]/60 backdrop-blur-2xs border border-amber-300/30">
                  {isCapsuleLocked ? 'Kapsul Waktu' : 'Kapsul Terbuka!'}
                </span>
              </div>
            ) : (
              /* Regular Romantic Bubble */
              <div
                className={`relative flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full transition-transform duration-200 group-hover:scale-105 ${
                  isFromCandut
                    ? 'bg-[#4A6B82]/25 border border-[#4A6B82]/50 shadow-sm'
                    : 'bg-[#D8738E]/25 border border-[#D8738E]/50 shadow-sm'
                } backdrop-blur-[2px]`}
              >
                {/* Internal Glass Highlight */}
                <div className="absolute top-2 left-3 w-4 h-2 bg-white/60 rounded-full -rotate-45" />

                {/* Category SVG Icon or Voice Conch Icon */}
                <div className="mb-0.5">
                  {hasVoiceNote ? (
                    <img src="/icons/whisper_voice.png" alt="Bisikan Suara" className="w-6 h-6 object-contain drop-shadow-xs" />
                  ) : (
                    getCategoryIcon(msg.category || 'love')
                  )}
                </div>

                {/* Typographic Sender Label */}
                <span className="text-[10px] font-bold tracking-wider uppercase text-white drop-shadow-sm">
                  {senderDisplayName}
                </span>

                {/* Voice Note Indicator */}
                {hasVoiceNote && (
                  <div
                    className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#D8738E] text-white flex items-center justify-center shadow-xs"
                    title="Pesan Bisikan Suara"
                  >
                    <Volume2 className="w-2.5 h-2.5" />
                  </div>
                )}

                {/* Private Lock Indicator */}
                {!isRecipient && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center drop-shadow-md"
                    title="Pesan privat untuk pasangan"
                  >
                    <img src="/icons/heart_lock.png" alt="Privat" className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Recipient Action Indicator */}
                {isRecipient && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center drop-shadow-md"
                    title="Ketuk untuk membuka pesan"
                  >
                    <img src="/icons/chat_bubble.png" alt="Buka Pesan" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            )}

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none min-w-[150px] z-20">
              <div className="bg-white text-[#182C3A] text-xs px-3 py-1.5 rounded-xl border border-[#CBD7DF] text-center shadow-lg">
                <p className={`font-semibold ${isFromCandut ? 'text-[#4A6B82]' : 'text-[#D8738E]'}`}>
                  {isTimeCapsule ? 'Kapsul Waktu Laut Dalam' : senderDisplayName}
                </p>
                <p className="text-[11px] text-[#526A7A]">
                  {isCapsuleLocked 
                    ? 'Terkunci hingga waktunya tiba' 
                    : hasVoiceNote 
                    ? 'Bisikan suara siap didengar'
                    : isRecipient 
                    ? 'Ketuk untuk membuka' 
                    : 'Menunggu pasangan'}
                </p>
              </div>
              <div className="w-2 h-2 bg-white rotate-45 -mt-1 border-r border-b border-[#CBD7DF]" />
            </div>

            {/* Blocked Alert */}
            {blockedHint && blockedHint.id === msg.id && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 bg-white text-[#D8738E] text-[11px] px-3 py-1.5 rounded-xl border border-[#F3C5D1] text-center shadow-xl z-30 font-medium">
                {blockedHint.text}
              </div>
            )}
          </div>
        );
      })}

      {/* Feature #2: Interactive Locked Time Capsule Countdown Modal */}
      {lockedCapsuleView && lockedCapsuleView.unlock_at && typeof document !== 'undefined' && (() => {
        const time = formatRemainingTime(lockedCapsuleView.unlock_at);
        const isFromCandut = lockedCapsuleView.sender_role === 'candut';
        const sender = isFromCandut ? 'Candut' : 'Saridut';
        const formattedTarget = new Date(lockedCapsuleView.unlock_at).toLocaleString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/60 backdrop-blur-sm animate-fadeIn pointer-events-auto">
            <div className="relative w-full max-w-sm bg-white border border-[#CBD7DF] rounded-2xl p-6 shadow-2xl text-[#182C3A] text-center max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setLockedCapsuleView(null)}
                aria-label="Tutup modal"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-24 h-24 mx-auto mb-2 relative flex items-center justify-center">
                <div className="absolute inset-2 bg-gradient-to-tr from-amber-200/50 via-teal-200/40 to-amber-100/50 rounded-full blur-md" />
                <img 
                  src="/icons/time_capsule.png" 
                  alt="Kapsul Waktu" 
                  className="w-20 h-20 object-contain drop-shadow-md animate-pulse relative z-10" 
                />
              </div>

              <h3 className="font-serif text-xl font-bold text-[#182C3A]">
                Kapsul Waktu Laut Dalam
              </h3>
              <p className="text-xs text-[#526A7A] mt-1">
                Disimpan oleh <strong className="text-[#182C3A]">{sender}</strong> dengan penuh cinta
              </p>

              {/* Countdown Ticker Cards */}
              <div className="grid grid-cols-4 gap-2 my-5 p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] shadow-inner">
                <div>
                  <div className="text-xl font-mono font-bold text-[#B45309]">{time.days}</div>
                  <div className="text-[10px] text-[#92400E] font-medium tracking-wider uppercase">Hari</div>
                </div>
                <div>
                  <div className="text-xl font-mono font-bold text-[#B45309]">{time.hours}</div>
                  <div className="text-[10px] text-[#92400E] font-medium tracking-wider uppercase">Jam</div>
                </div>
                <div>
                  <div className="text-xl font-mono font-bold text-[#B45309]">{time.minutes}</div>
                  <div className="text-[10px] text-[#92400E] font-medium tracking-wider uppercase">Menit</div>
                </div>
                <div>
                  <div className="text-xl font-mono font-bold text-[#B45309]">{time.seconds}</div>
                  <div className="text-[10px] text-[#92400E] font-medium tracking-wider uppercase">Detik</div>
                </div>
              </div>

              <p className="text-xs text-[#526A7A] leading-relaxed mb-5">
                Kapsul ini bersemayam di dasar pasir akuarium. Rahasia di dalamnya baru akan terungkap pada:<br />
                <strong className="text-[#182C3A] font-semibold">{formattedTarget}</strong>
              </p>

              <button
                onClick={() => setLockedCapsuleView(null)}
                className="w-full py-2.5 bg-[#4A6B82] hover:bg-[#3B596E] text-white text-xs font-semibold rounded-xl transition shadow-md active:scale-98"
              >
                Tutup &amp; Simpan Rahasia
              </button>
            </div>
          </div>,
          document.body
        );
      })()}

      <style jsx>{`
        @keyframes editorialBubbleFloat {
          0% {
            transform: translate(-50%, -50%) translateY(0px);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-10px);
          }
          100% {
            transform: translate(-50%, -50%) translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}

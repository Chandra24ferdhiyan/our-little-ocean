'use client';

import React, { useState } from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { BubbleMessage } from '@/types/aquarium';
import { 
  Heart, 
  Sparkles, 
  Clock, 
  LockKeyhole, 
  MessageCircle, 
  FileText 
} from 'lucide-react';

interface FloatingBubblesProps {
  onOpenBubble: (bubble: BubbleMessage) => void;
}

export function FloatingBubbles({ onOpenBubble }: FloatingBubblesProps) {
  const { messages, currentUser, openBubbleMessage } = useAquarium();
  const [blockedHint, setBlockedHint] = useState<{ id: string; text: string } | null>(null);

  const pendingBubbles = messages.filter((m) => m.status === 'pending');

  const handleBubbleClick = (e: React.MouseEvent, msg: BubbleMessage) => {
    e.stopPropagation();

    if (msg.recipient_id !== currentUser.id) {
      setBlockedHint({
        id: msg.id,
        text: `Pesan ditujukan khusus untuk ${msg.sender_role === 'candut' ? 'Repa' : 'Candut'}. Tunggu pasanganmu membukanya.`,
      });
      setTimeout(() => setBlockedHint(null), 3000);
      return;
    }

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

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {pendingBubbles.map((msg, index) => {
        const isRecipient = msg.recipient_id === currentUser.id;
        const isFromCandut = msg.sender_role === 'candut';

        const floatDelay = (index * 0.8) % 3;
        const floatDuration = 4.5 + (index % 2);

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
            {/* Iridescent Realistic Glass Bubble */}
            <div
              className={`relative flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full transition-transform duration-200 group-hover:scale-105 ${
                isFromCandut
                  ? 'bg-[#4A6B82]/25 border border-[#4A6B82]/50 shadow-sm'
                  : 'bg-[#D8738E]/25 border border-[#D8738E]/50 shadow-sm'
              } backdrop-blur-[2px]`}
            >
              {/* Internal Glass Highlight */}
              <div className="absolute top-2 left-3 w-4 h-2 bg-white/60 rounded-full -rotate-45" />

              {/* Category SVG Icon */}
              <div className="mb-0.5">
                {getCategoryIcon(msg.category || 'love')}
              </div>

              {/* Typographic Sender Label */}
              <span className="text-[10px] font-bold tracking-wider uppercase text-white drop-shadow-sm">
                {msg.sender_name}
              </span>

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

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none min-w-[150px] z-20">
              <div className="bg-white text-[#182C3A] text-xs px-3 py-1.5 rounded-xl border border-[#CBD7DF] text-center shadow-lg">
                <p className={`font-semibold ${isFromCandut ? 'text-[#4A6B82]' : 'text-[#D8738E]'}`}>{msg.sender_name}</p>
                <p className="text-[11px] text-[#526A7A]">
                  {isRecipient ? 'Ketuk untuk membuka' : 'Menunggu pasangan'}
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

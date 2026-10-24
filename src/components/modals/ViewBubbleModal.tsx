'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BubbleMessage } from '@/types/aquarium';
import { playWhisperVoiceSound } from '@/lib/audio/soundEffects';
import { 
  X, 
  Clock, 
  Sparkles, 
  Play,
  Pause,
  Volume2,
  Hourglass,
  Calendar,
  Lock,
  Unlock,
  CornerUpLeft
} from 'lucide-react';

interface ViewBubbleModalProps {
  message: BubbleMessage | null;
  onClose: () => void;
  onReply?: (msg: BubbleMessage) => void;
}

export function ViewBubbleModal({ message, onClose, onReply }: ViewBubbleModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setPlaybackTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [message]);

  if (!message) return null;

  const isFromCandut = message.sender_role === 'candut';
  const senderName = isFromCandut
    ? 'Candut'
    : (message.sender_role === 'repa' || (message.sender_name && message.sender_name.toLowerCase().includes('repa')) ? 'Saridut' : (message.sender_name || 'Saridut'));
  
  const formattedDate = new Date(message.created_at).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedUnlock = message.unlock_at
    ? new Date(message.unlock_at).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const handleTogglePlay = () => {
    if (!message.audio_url) return;

    if (!audioRef.current) {
      const audio = new Audio(message.audio_url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setPlaybackTime(Math.floor(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playWhisperVoiceSound();
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const xpReward = message.is_capsule ? 50 : 25;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-[#E2EAF0] rounded-2xl p-5 sm:p-6 md:p-8 shadow-2xl text-[#182C3A] max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            onClose();
          }}
          aria-label="Tutup pesan"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sender Identity & Capsule Badge */}
        <div className="flex items-center space-x-3 mb-5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-serif text-lg font-bold border shrink-0 ${
              isFromCandut
                ? 'bg-[#EBF2F7] border-[#CBD7DF] text-[#4A6B82]'
                : 'bg-[#FCE8EE] border-[#F3C5D1] text-[#D8738E]'
            }`}
          >
            {message.is_capsule ? (
              <img src="/icons/time_capsule.png" alt="Kapsul" className="w-7 h-7 object-contain" />
            ) : message.audio_url ? (
              <img src="/icons/whisper_voice.png" alt="Suara" className="w-7 h-7 object-contain" />
            ) : (
              senderName.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif text-lg text-[#182C3A] tracking-wide font-bold">
                {senderName}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                message.is_capsule
                  ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                  : message.audio_url
                  ? 'bg-[#FCE8EE] text-[#D8738E] border-[#F3C5D1]'
                  : isFromCandut
                  ? 'bg-[#EBF2F7] text-[#4A6B82] border-[#CBD7DF]'
                  : 'bg-[#FCE8EE] text-[#D8738E] border-[#F3C5D1]'
              }`}>
                {message.is_capsule ? 'Kapsul Waktu' : message.audio_url ? 'Bisikan Suara' : 'Pesan Personal'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-[#526A7A] mt-0.5">
              <Clock className="w-3 h-3 text-[#4A6B82]" />
              <span>Dilepas: {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Time Capsule Unlock Banner */}
        {message.is_capsule && formattedUnlock && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs flex items-center space-x-2">
            <Hourglass className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>Kapsul dibuka pada: <strong>{formattedUnlock}</strong></span>
          </div>
        )}

        {/* Voice Note Player (Feature #3) */}
        {message.audio_url && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-[#EBF2F7] to-[#FCE8EE] border border-[#CBD7DF] shadow-xs">
            <div className="flex items-center space-x-3.5">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-full bg-[#4A6B82] hover:bg-[#3B596E] text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0"
                title={isPlaying ? 'Jeda Suara' : 'Putar Bisikan Suara'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5 text-xs font-semibold text-[#182C3A]">
                  <span className="flex items-center space-x-1">
                    <Volume2 className="w-3.5 h-3.5 text-[#D8738E]" />
                    <span>Bisikan Suara Romantis</span>
                  </span>
                  <span className="font-mono text-[#526A7A] text-[11px]">
                    00:{playbackTime < 10 ? `0${playbackTime}` : playbackTime} / 00:{message.audio_duration ? (message.audio_duration < 10 ? `0${message.audio_duration}` : message.audio_duration) : '15'}
                  </span>
                </div>

                {/* Animated Soundwave Bars */}
                <div className="flex items-center space-x-1 h-5 py-0.5">
                  {[40, 75, 55, 95, 60, 85, 45, 90, 70, 50, 80, 65, 90, 45, 60].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${isPlaying ? Math.max(20, (h + Math.sin(playbackTime * 4 + i) * 35)) : 25}%` }}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPlaying ? 'bg-[#D8738E]' : 'bg-[#CBD7DF]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quoted Message (If this message is a reply to an earlier message) */}
        {message.reply_to_message && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#F1F5F8] to-[#FFF9FB] border-l-4 border-l-[#D8738E] border border-[#E2EAF0] text-xs shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#D8738E] mb-1">
              <span className="flex items-center space-x-1.5">
                <CornerUpLeft className="w-3.5 h-3.5" />
                <span>Membalas Pesan {message.reply_to_sender_name || 'Pasangan'}:</span>
              </span>
              <span className="text-[10px] text-[#526A7A] font-medium uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded-full border border-[#E2EAF0]">
                Pesan Sebelumnya
              </span>
            </div>
            <p className="text-[#334D5C] italic line-clamp-3 bg-white/90 p-2.5 rounded-xl border border-black/5 mt-1.5 leading-relaxed">
              &ldquo;{message.reply_to_message}&rdquo;
            </p>
          </div>
        )}

        {/* Letter Body Card */}
        {message.message && message.message !== '🎙️ Bisikan Suara Bawah Air' && (
          <div className={`p-4 md:p-5 rounded-xl border mb-5 ${
            isFromCandut
              ? 'bg-[#F8FAFC] border-[#CBD7DF]'
              : 'bg-[#FFF9FB] border-[#F3C5D1]'
          }`}>
            <p className="font-serif text-base leading-relaxed text-[#182C3A] whitespace-pre-wrap">
              &ldquo;{message.message}&rdquo;
            </p>
          </div>
        )}

        {/* Footer & Status */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2EAF0] text-xs gap-2">
          <div className="flex items-center space-x-1.5 text-[#4A6B82] min-w-0 truncate">
            <Sparkles className="w-4 h-4 text-[#D8738E] shrink-0" />
            <span className="font-semibold text-[#182C3A] truncate">+{xpReward} XP Hubungan</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onReply && (
              <button
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  onClose();
                  onReply(message);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-95 text-white font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition active:scale-95 text-xs"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
                <span>Balas Pesan</span>
              </button>
            )}
            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                onClose();
              }}
              className="px-3.5 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F8] text-[#182C3A] font-semibold rounded-lg border border-[#CBD7DF] transition shadow-2xs text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

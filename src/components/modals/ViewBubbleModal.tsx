'use client';

import React from 'react';
import { BubbleMessage } from '@/types/aquarium';
import { 
  X, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Heart 
} from 'lucide-react';

interface ViewBubbleModalProps {
  message: BubbleMessage | null;
  onClose: () => void;
}

export function ViewBubbleModal({ message, onClose }: ViewBubbleModalProps) {
  if (!message) return null;

  const isFromCandut = message.sender_role === 'candut';
  const formattedDate = new Date(message.created_at).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/30 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-[#E2EAF0] rounded-2xl p-5 sm:p-6 md:p-8 shadow-2xl text-[#182C3A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup pesan"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sender Identity */}
        <div className="flex items-center space-x-3 mb-5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-serif text-lg font-bold border ${
              isFromCandut
                ? 'bg-[#EBF2F7] border-[#CBD7DF] text-[#4A6B82]'
                : 'bg-[#FCE8EE] border-[#F3C5D1] text-[#D8738E]'
            }`}
          >
            {message.sender_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif text-lg text-[#182C3A] tracking-wide">
                {message.sender_name}
              </h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                isFromCandut
                  ? 'bg-[#EBF2F7] text-[#4A6B82] border-[#CBD7DF]'
                  : 'bg-[#FCE8EE] text-[#D8738E] border-[#F3C5D1]'
              }`}>
                Pesan Personal
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-[#526A7A] mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Letter Body Card */}
        <div className={`p-4 md:p-5 rounded-xl border mb-5 ${
          isFromCandut
            ? 'bg-[#F8FAFC] border-[#CBD7DF]'
            : 'bg-[#FFF9FB] border-[#F3C5D1]'
        }`}>
          <p className="font-serif text-base leading-relaxed text-[#182C3A] whitespace-pre-wrap">
            &ldquo;{message.message}&rdquo;
          </p>
        </div>

        {/* Footer & Status */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2EAF0] text-xs">
          <div className="flex items-center space-x-1.5 text-[#4A6B82]">
            <Sparkles className="w-4 h-4 text-[#D8738E]" />
            <span className="font-semibold text-[#182C3A]">+25 XP Hubungan Diperoleh</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F8] text-[#182C3A] font-semibold rounded-lg border border-[#CBD7DF] transition shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

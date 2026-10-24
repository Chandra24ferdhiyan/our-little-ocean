'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getMilestoneForLevel } from '@/lib/level-system/levelConfig';
import { Award, CheckCircle2, X } from 'lucide-react';

interface MilestoneModalProps {
  level: number | null;
  onClose: () => void;
}

export function MilestoneModal({ level, onClose }: MilestoneModalProps) {
  useEffect(() => {
    if (level) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#4A6B82', '#D8738E', '#8FA6B5', '#FCE8EE', '#9B7C94'],
      });
    }
  }, [level]);

  if (!level) return null;

  const milestone = getMilestoneForLevel(level);
  const pelletBonus = level === 500 ? 50 : level === 400 ? 25 : level === 300 ? 20 : level === 200 ? 15 : 10;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-[#CBD7DF] rounded-2xl p-5 sm:p-6 md:p-8 shadow-2xl text-[#182C3A] text-center max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup perayaan"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Milestone Pearl Emblem */}
        <div className="w-20 h-20 mx-auto mb-2 relative flex items-center justify-center">
          <div className="absolute inset-2 bg-gradient-to-tr from-amber-200/50 via-teal-200/40 to-pink-200/50 rounded-full blur-md" />
          <img 
            src={`/icons/pearl_${level}.png`} 
            alt={`Mutiara Level ${level}`}
            className="w-16 h-16 object-contain relative z-10 drop-shadow-md animate-bounce"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EBF2F7] text-[#4A6B82] border border-[#CBD7DF] uppercase tracking-wider shadow-2xs">
          {milestone.badge}
        </span>

        <h2 className="font-serif text-2xl text-[#182C3A] mt-2.5 tracking-wide font-bold">
          Pencapaian Level {level}
        </h2>
        <p className="text-xs text-[#D8738E] mt-0.5 font-semibold">{milestone.title} &mdash; {milestone.subtitle}</p>

        {/* Bonus Pelet Reward Card */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[#92400E] text-xs font-bold mt-2 shadow-2xs">
          <img src="/icons/pellet_coin.png" alt="Pelet" className="w-4 h-4 object-contain" />
          <span>Hadiah Langsung: +{pelletBonus} Pelet Emas!</span>
        </div>

        <p className="text-xs text-[#526A7A] mt-2.5 leading-relaxed">{milestone.description}</p>

        {/* Unlocked Perks */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2EAF0] text-left space-y-2">
          <p className="text-xs font-bold text-[#182C3A]">
            Fitur &amp; Keistimewaan Terbuka:
          </p>
          {milestone.unlockedFeatures.map((feat, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-xs text-[#526A7A]">
              <CheckCircle2 className="w-4 h-4 text-[#4A6B82] shrink-0 mt-0.5" />
              <span className="leading-snug">{feat}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-95 text-white text-xs font-semibold rounded-xl transition shadow-md active:scale-98"
        >
          Lanjutkan Perjalanan Bersama
        </button>
      </div>
    </div>
  );
}

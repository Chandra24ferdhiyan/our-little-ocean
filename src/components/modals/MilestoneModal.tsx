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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/30 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-[#E2EAF0] rounded-2xl p-5 sm:p-6 md:p-8 shadow-2xl text-[#182C3A] text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup perayaan"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Milestone Emblem */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#EBF2F7] to-[#FCE8EE] border border-[#CBD7DF] flex items-center justify-center text-[#4A6B82] mb-4 shadow-xs">
          <Award className="w-8 h-8 stroke-[1.8]" />
        </div>

        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#EBF2F7] text-[#4A6B82] border border-[#CBD7DF] uppercase tracking-wider">
          {milestone.badge}
        </span>

        <h2 className="font-serif text-2xl text-[#182C3A] mt-2.5 tracking-wide font-semibold">
          Pencapaian Level {level}
        </h2>
        <p className="text-xs text-[#D8738E] mt-0.5 font-medium">{milestone.title} &mdash; {milestone.subtitle}</p>
        <p className="text-xs text-[#526A7A] mt-2 leading-relaxed">{milestone.description}</p>

        {/* Unlocked Perks */}
        <div className="mt-5 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2EAF0] text-left space-y-2">
          <p className="text-xs font-bold text-[#182C3A]">
            Fitur dan Atmosfer Terbuka:
          </p>
          {milestone.unlockedFeatures.map((feat, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-xs text-[#526A7A]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4A6B82] shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-90 text-white text-xs font-semibold rounded-xl transition shadow-xs"
        >
          Lanjutkan Perjalanan Bersama
        </button>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { LEVEL_MILESTONES, getRequiredXpForNextLevel } from '@/lib/level-system/levelConfig';
import { X, LockKeyhole, Award } from 'lucide-react';

interface LevelRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LevelRoadmapModal({ isOpen, onClose }: LevelRoadmapModalProps) {
  const { aquarium } = useAquarium();

  if (!isOpen) return null;

  const currentLevel = aquarium.current_level;
  const requiredXp = getRequiredXpForNextLevel(currentLevel);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#E2EAF0] rounded-2xl shadow-2xl text-[#182C3A] max-h-[88vh] flex flex-col overflow-hidden">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#E2EAF0] bg-white shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EBF2F7] border border-[#CBD7DF] flex items-center justify-center p-1.5 shadow-2xs shrink-0">
              <img src="/icons/trophy.png" alt="Peta Evolusi" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base sm:text-lg text-[#182C3A] tracking-wide font-bold leading-tight truncate">
                Peta Evolusi Level 1–500
              </h2>
              <p className="text-[11px] sm:text-xs text-[#526A7A] mt-0.5 truncate">
                Level saat ini: <strong className="text-[#182C3A] font-bold font-mono">Level {currentLevel}</strong> ({aquarium.current_xp}/{requiredXp} XP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup peta evolusi"
            className="p-1.5 rounded-xl text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition shrink-0 ml-1.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Roadmap Stages */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {LEVEL_MILESTONES.map((m) => {
            const isUnlocked = currentLevel >= m.levelRange[0];
            const isCurrent = currentLevel >= m.levelRange[0] && currentLevel <= m.levelRange[1];
            const isCompleted = currentLevel > m.levelRange[1];

            return (
              <div
                key={m.stage}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-[#EBF2F7]/80 border-[#4A6B82] ring-1 ring-[#4A6B82]/50 shadow-xs'
                    : isCompleted
                    ? 'bg-[#F8FAFC] border-[#CBD7DF]'
                    : 'bg-[#F8FAFC]/50 border-[#E2EAF0] opacity-60'
                }`}
              >
                {/* Stage Header: Pearl + Titles + Status Badge */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E2EAF0]/60">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
                      <img
                        src={`/icons/pearl_${m.stage * 100}.png`}
                        alt={`Tahap ${m.stage}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <h3 className="font-serif text-sm sm:text-base text-[#182C3A] font-bold leading-tight">
                          {m.title}
                        </h3>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white text-[#4A6B82] border border-[#CBD7DF] whitespace-nowrap shadow-2xs">
                          Lvl {m.levelRange[0]}–{m.levelRange[1]}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-[#D8738E] font-medium leading-tight mt-0.5">
                        {m.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 self-start">
                    {isCurrent ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold bg-[#4A6B82] text-white shadow-2xs whitespace-nowrap">
                        Aktif
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-semibold bg-[#EBF2F7] text-[#4A6B82] border border-[#CBD7DF] whitespace-nowrap">
                        Selesai
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-medium text-[#526A7A] bg-[#E2EAF0] whitespace-nowrap">
                        <LockKeyhole className="w-3 h-3" />
                        <span>Terkunci</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Stage Content: Description & Features */}
                <div className="pt-2.5 space-y-2">
                  <p className="text-xs text-[#526A7A] leading-relaxed">
                    {m.description}
                  </p>

                  {/* Unlocked Features */}
                  <div className="space-y-1 pt-0.5">
                    {m.unlockedFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5 text-[11px] text-[#526A7A]">
                        <Award className="w-3.5 h-3.5 text-[#4A6B82] shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Visual Evolution Sprite Preview */}
                  <div className="mt-2.5 pt-2 border-t border-[#E2EAF0]/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center -space-x-1.5">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-[#CBD7DF] p-0.5 shadow-2xs">
                          <img
                            src={`/fish/candut_stage${m.stage}.png?v=2`}
                            alt={`Candut Tahap ${m.stage}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-[#F3C5D1] p-0.5 shadow-2xs">
                          <img
                            src={`/fish/repa_stage${m.stage}.png?v=2`}
                            alt={`Saridut Tahap ${m.stage}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#526A7A]">
                        Bentuk Candut &amp; Saridut Tahap {m.stage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Footer */}
        <div className="p-3 sm:p-4 border-t border-[#E2EAF0] bg-[#F8FAFC] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white hover:bg-[#F1F5F8] border border-[#CBD7DF] text-xs font-semibold text-[#182C3A] transition shadow-xs active:scale-95"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}

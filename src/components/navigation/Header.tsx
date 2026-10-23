'use client';

import React, { useState } from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { getMilestoneForLevel, getRequiredXpForNextLevel } from '@/lib/level-system/levelConfig';
import { toggleMute, getIsMuted } from '@/lib/audio/soundEffects';

interface HeaderProps {
  onOpenCreateBubble: () => void;
  onOpenThemes: () => void;
  onOpenPellets: () => void;
  onOpenCouple: () => void;
  onOpenHistory: () => void;
  onOpenMilestone: () => void;
}

export function Header({
  onOpenCreateBubble,
  onOpenThemes,
  onOpenPellets,
  onOpenCouple,
  onOpenHistory,
  onOpenMilestone,
}: HeaderProps) {
  const { aquarium, currentUser, feedFish } = useAquarium();
  const [muted, setMutedState] = useState(getIsMuted());

  const milestone = getMilestoneForLevel(aquarium.current_level);
  const requiredXp = getRequiredXpForNextLevel(aquarium.current_level);
  const progressPct = Math.min(100, Math.floor((aquarium.current_xp / requiredXp) * 100));

  const handleAudioToggle = () => {
    const isNowMuted = toggleMute();
    setMutedState(isNowMuted);
  };

  return (
    <header className="w-full bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E2EAF0] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 sticky top-0 z-40 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4 lg:gap-6">
        
        {/* Row 1 on Mobile: Logo Brand & Mobile Audio Toggle */}
        <div className="flex items-center justify-between w-full md:w-auto shrink-0">
          <div className="flex items-center">
            <img
              src="/brand-logo.png"
              alt="Candut & Saridut — Our Little Ocean"
              className="h-11 sm:h-12 lg:h-14 w-auto object-contain max-w-[230px] sm:max-w-[280px] lg:max-w-[320px] transition-all drop-shadow-2xs select-none"
            />
          </div>

          {/* Role Indicator & Audio Mute Button on Mobile only (< md) */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={onOpenCouple}
              title="Ganti peran atau kelola profil"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition shadow-2xs active:scale-95 ${
                currentUser.partner_role === 'candut'
                  ? 'bg-[#EBF2F7] border-[#4A6B82]/40 text-[#4A6B82]'
                  : 'bg-[#FCE8EE] border-[#D8738E]/40 text-[#D8738E]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${currentUser.partner_role === 'candut' ? 'bg-[#4A6B82]' : 'bg-[#D8738E]'}`} />
              <span>{currentUser.display_name}</span>
            </button>

            <button
              onClick={handleAudioToggle}
              aria-label={muted ? 'Aktifkan suara' : 'Bisukan suara'}
              className="p-1.5 rounded-xl bg-[#F8FAFC] border border-[#CBD7DF] shadow-2xs hover:bg-[#F1F5F8] transition active:scale-95"
            >
              <img
                src={muted ? '/icons/sound_off.png' : '/icons/sound_on.png'}
                alt={muted ? 'Suara Mati' : 'Suara Nyala'}
                className="w-5 h-5 object-contain"
              />
            </button>
          </div>
        </div>

        {/* Level Progression Bar (Protected against squishing with min-width and nowrap) */}
        <button
          onClick={onOpenMilestone}
          className="w-full md:w-auto flex-1 min-w-[220px] max-w-full md:max-w-sm xl:max-w-md px-3.5 sm:px-4 py-2 bg-[#FFFFFF] border border-[#E2EAF0] rounded-xl hover:border-[#CBD7DF] transition text-left group shadow-xs shrink-0 md:shrink"
          title="Lihat peta evolusi level"
        >
          <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 min-w-0">
              <img src="/icons/trophy.png" alt="Trophy" className="w-4 h-4 object-contain inline-block shrink-0" />
              <span className="font-semibold text-[#182C3A] whitespace-nowrap">Level {aquarium.current_level}</span>
              <span className="text-[11px] text-[#526A7A] hidden sm:inline truncate max-w-[110px] lg:max-w-[150px]">&mdash; {milestone.title}</span>
            </div>
            <span className="text-[11px] text-[#526A7A] font-mono shrink-0 whitespace-nowrap font-medium">
              {aquarium.current_xp}/{requiredXp} XP ({progressPct}%)
            </span>
          </div>

          <div className="w-full h-1.5 bg-[#E2EAF0] rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full rounded-full bg-gradient-to-r from-[#4A6B82] to-[#D8738E] transition-all duration-300"
            />
          </div>
        </button>

        {/* Action Controls for Tablet & Desktop */}
        <div className="hidden md:flex items-center space-x-2 shrink-0">
          {/* Tulis Pesan Button */}
          <button
            onClick={onOpenCreateBubble}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-90 text-white text-xs font-semibold transition active:scale-95 shadow-xs"
          >
            <img src="/icons/icon_plus.png" alt="Pesan" className="w-3.5 h-3.5 object-contain" />
            <span className="hidden sm:inline">Tulis Pesan</span>
          </button>

          {/* Beri Makan Button */}
          <button
            onClick={() => feedFish(1)}
            disabled={aquarium.pellet_balance < 1}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#EBF2F7] hover:bg-[#DDE8F0] border border-[#CBD7DF] text-[#4A6B82] text-xs font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Beri makan Candut dan Saridut (1 pelet)"
          >
            <img src="/icons/pellet.png" alt="Pelet" className="w-3.5 h-3.5 object-contain" />
            <span className="hidden sm:inline">Beri Makan</span>
          </button>

          {/* Pelet Balance */}
          <button
            onClick={onOpenPellets}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2EAF0] text-[#526A7A] hover:text-[#182C3A] text-xs font-medium transition"
            title="Inventaris Pelet dan Hadiah"
          >
            <img src="/icons/pellet_coin.png" alt="Jumlah Pelet" className="w-3.5 h-3.5 object-contain" />
            <span className="font-mono font-semibold text-[#4A6B82]">{aquarium.pellet_balance}</span>
            <span className="hidden xl:inline">Pelet</span>
          </button>

          {/* Tema (Tampil di Desktop lg+) */}
          <button
            onClick={onOpenThemes}
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2EAF0] text-[#526A7A] hover:text-[#182C3A] text-xs transition"
          >
            <img src="/icons/palette.png" alt="Tema" className="w-3.5 h-3.5 object-contain" />
            <span>Tema</span>
          </button>

          {/* Riwayat (Tampil di Desktop lg+) */}
          <button
            onClick={onOpenHistory}
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2EAF0] text-[#526A7A] hover:text-[#182C3A] text-xs transition"
          >
            <img src="/icons/eye.png" alt="Riwayat" className="w-3.5 h-3.5 object-contain" />
            <span>Riwayat</span>
          </button>

          {/* Audio Toggle (md+) */}
          <button
            onClick={handleAudioToggle}
            aria-label={muted ? 'Aktifkan suara' : 'Bisukan suara'}
            className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2EAF0] text-[#526A7A] hover:text-[#182C3A] text-xs transition"
            title={muted ? 'Aktifkan suara' : 'Bisukan suara'}
          >
            <img
              src={muted ? '/icons/sound_off.png' : '/icons/sound_on.png'}
              alt={muted ? 'Suara Mati' : 'Suara Nyala'}
              className="w-4 h-4 object-contain"
            />
          </button>

          {/* Pasangan (Tampil di Desktop lg+) */}
          <button
            onClick={onOpenCouple}
            title="Ganti peran atau kelola profil pasangan"
            className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 ${
              currentUser.partner_role === 'candut'
                ? 'bg-[#EBF2F7] border-[#4A6B82]/40 text-[#4A6B82] hover:bg-[#DDE8F0]'
                : 'bg-[#FCE8EE] border-[#D8738E]/40 text-[#D8738E] hover:bg-[#F9D6DF]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${currentUser.partner_role === 'candut' ? 'bg-[#4A6B82]' : 'bg-[#D8738E]'}`} />
            <span>Kamu: {currentUser.display_name}</span>
          </button>
        </div>

      </div>
    </header>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { initRomanticMusic } from '@/lib/audio/soundEffects';
import dynamic from 'next/dynamic';

const AquariumCanvas = dynamic(
  () => import('@/components/aquarium/AquariumCanvas').then((mod) => mod.AquariumCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F4F7F9] text-[#4A6B82]">
        <div className="w-10 h-10 rounded-full border-2 border-[#4A6B82] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold tracking-wider uppercase text-[#182C3A]">Memuat Samudera Candut &amp; Repa</p>
      </div>
    ),
  }
);

const FloatingBubbles = dynamic(
  () => import('@/components/bubbles/FloatingBubbles').then((mod) => mod.FloatingBubbles),
  { ssr: false }
);

import { Header } from '@/components/navigation/Header';
import { BottomNav } from '@/components/navigation/BottomNav';
import { OceanDecorations } from '@/components/decorations/OceanDecorations';
import { CreateBubbleModal } from '@/components/modals/CreateBubbleModal';
import { ViewBubbleModal } from '@/components/modals/ViewBubbleModal';
import { ThemeModal } from '@/components/modals/ThemeModal';
import { PelletModal } from '@/components/modals/PelletModal';
import { CoupleModal } from '@/components/modals/CoupleModal';
import { MessageHistoryModal } from '@/components/modals/MessageHistoryModal';
import { MilestoneModal } from '@/components/modals/MilestoneModal';
import { LevelRoadmapModal } from '@/components/modals/LevelRoadmapModal';
import { BubbleMessage } from '@/types/aquarium';
import { Plus, CircleDot } from 'lucide-react';

export default function HomePage() {
  const { 
    aquarium, 
    milestoneCelebration, 
    setMilestoneCelebration,
    feedFish
  } = useAquarium();

  // Modals state
  const [isCreateBubbleOpen, setIsCreateBubbleOpen] = useState(false);
  const [selectedBubble, setSelectedBubble] = useState<BubbleMessage | null>(null);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isPelletOpen, setIsPelletOpen] = useState(false);
  const [isCoupleOpen, setIsCoupleOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMilestoneRoadmapOpen, setIsMilestoneRoadmapOpen] = useState(false);

  useEffect(() => {
    initRomanticMusic();
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-[#071118] via-[#0C1A24] to-[#112330] text-[#E8F1F5] relative overflow-x-hidden pb-16 lg:pb-6">
      {/* Editorial Header (Desktop Actions & Mobile Title/Audio) */}
      <Header
        onOpenCreateBubble={() => setIsCreateBubbleOpen(true)}
        onOpenThemes={() => setIsThemeOpen(true)}
        onOpenPellets={() => setIsPelletOpen(true)}
        onOpenCouple={() => setIsCoupleOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenMilestone={() => setIsMilestoneRoadmapOpen(true)}
      />

      {/* Main Focus: Pure Cinematic Aquarium Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 md:px-6 py-1.5 sm:py-3 flex flex-col items-center justify-between lg:justify-center">
        {/* Outer Aquarium Wrapper with Atmospheric Backlight Halo */}
        <div className="relative w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center">
          {/* Ambient Backlight Halo behind the tank */}
          <div className="absolute -inset-2 sm:-inset-6 bg-gradient-to-r from-[#3B6E8C]/25 via-[#5BA4C7]/20 to-[#D8738E]/20 rounded-3xl blur-2xl pointer-events-none opacity-80" />

          {/* Pure Aquarium Viewport */}
          <div className="relative w-full h-[calc(100dvh-235px)] min-h-[440px] max-h-[680px] md:h-auto md:aspect-[16/10] lg:aspect-[16/9] lg:max-h-[740px] rounded-2xl overflow-hidden border border-white/20 bg-[#07131B] shadow-[0_16px_50px_rgba(0,0,0,0.65)] ring-1 ring-white/10">
            {/* Canvas 60fps Fish Simulation */}
            <AquariumCanvas />

            {/* Floating Message Bubbles */}
            <FloatingBubbles
              onOpenBubble={(bubble) => {
                setSelectedBubble(bubble);
              }}
            />

            {/* Subtle Bottom Shade */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-10" />
          </div>

          {/* Seabed Ambient Decorations:
              - Anchored di sudut bawah bingkai akuarium
          */}
          <OceanDecorations />
        </div>

        {/* Quick Action Ribbon (< lg: Mobile & Tablet) */}
        <div className="lg:hidden w-full max-w-md sm:max-w-lg mt-2 sm:mt-3 flex items-center justify-between gap-2 px-1 relative z-30 shrink-0">
          {/* + Tulis Pesan */}
          <button
            onClick={() => setIsCreateBubbleOpen(true)}
            className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-r from-[#4A6B82] via-[#7B7086] to-[#D8738E] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition"
          >
            <img src="/icons/icon_plus.png" alt="Pesan" className="w-4 h-4 object-contain inline-block shrink-0" />
            <span>Tulis Pesan</span>
          </button>

          {/* Beri Makan */}
          <button
            onClick={() => feedFish(1)}
            disabled={aquarium.pellet_balance < 1}
            className="flex-1 py-2 px-2.5 rounded-xl bg-[#142633]/85 hover:bg-[#1C3345] border border-white/15 text-white/90 text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md backdrop-blur-md active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Beri makan Candut dan Saridut (1 pelet)"
          >
            <img src="/icons/pellet.png" alt="Pelet" className="w-4 h-4 object-contain inline-block shrink-0" />
            <span>Beri Makan</span>
          </button>

          {/* Jumlah Pelet */}
          <button
            onClick={() => setIsPelletOpen(true)}
            className="py-2 px-3 rounded-xl bg-[#142633]/85 hover:bg-[#1C3345] border border-white/15 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md backdrop-blur-md active:scale-95 transition"
            title="Inventaris Pelet dan Hadiah"
          >
            <img src="/icons/pellet_coin.png" alt="Jumlah Pelet" className="w-4 h-4 object-contain inline-block shrink-0" />
            <span className="font-mono text-[#F5B041] font-bold">{aquarium.pellet_balance}</span>
            <span>Pelet</span>
          </button>
        </div>
      </main>

      {/* Mobile-Only Bottom Navigation: Hadiah, Tema, Riwayat, Pasangan */}
      <BottomNav
        onOpenThemes={() => setIsThemeOpen(true)}
        onOpenPellets={() => setIsPelletOpen(true)}
        onOpenCouple={() => setIsCoupleOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Modals */}
      <CreateBubbleModal
        isOpen={isCreateBubbleOpen}
        onClose={() => setIsCreateBubbleOpen(false)}
      />

      <ViewBubbleModal
        message={selectedBubble}
        onClose={() => setSelectedBubble(null)}
      />

      <ThemeModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />

      <PelletModal
        isOpen={isPelletOpen}
        onClose={() => setIsPelletOpen(false)}
      />

      <CoupleModal
        isOpen={isCoupleOpen}
        onClose={() => setIsCoupleOpen(false)}
      />

      <MessageHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectMessage={(msg) => setSelectedBubble(msg)}
      />

      <LevelRoadmapModal
        isOpen={isMilestoneRoadmapOpen}
        onClose={() => setIsMilestoneRoadmapOpen(false)}
      />

      <MilestoneModal
        level={milestoneCelebration}
        onClose={() => setMilestoneCelebration(null)}
      />
    </div>
  );
}

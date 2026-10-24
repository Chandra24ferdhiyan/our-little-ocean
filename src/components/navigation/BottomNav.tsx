'use client';

import React from 'react';

interface BottomNavProps {
  onOpenThemes: () => void;
  onOpenPellets: () => void;
  onOpenCouple: () => void;
  onOpenHistory: () => void;
}

export function BottomNav({
  onOpenThemes,
  onOpenPellets,
  onOpenCouple,
  onOpenHistory,
}: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08131A]/95 backdrop-blur-md border-t border-white/10 px-4 py-1.5 flex items-center justify-around text-[10px] text-white/70 shadow-2xl">
      <button
        onClick={onOpenPellets}
        className="flex flex-col items-center space-y-1 py-1 text-white/70 hover:text-white active:scale-95 transition"
      >
        <img src="/icons/calendar.png" alt="Hadiah" className="w-5 h-5 object-contain" />
        <span className="font-medium tracking-tight">Hadiah</span>
      </button>

      <button
        onClick={onOpenThemes}
        className="flex flex-col items-center space-y-1 py-1 text-white/70 hover:text-white active:scale-95 transition"
      >
        <img src="/icons/palette.png" alt="Tema" className="w-5 h-5 object-contain" />
        <span className="font-medium tracking-tight">Tema</span>
      </button>

      <button
        onClick={onOpenHistory}
        className="flex flex-col items-center space-y-1 py-1 text-white/70 hover:text-white active:scale-95 transition"
      >
        <img src="/icons/chat_bubble.png" alt="Riwayat" className="w-5 h-5 object-contain" />
        <span className="font-medium tracking-tight">Riwayat</span>
      </button>

      <button
        onClick={onOpenCouple}
        className="flex flex-col items-center space-y-1 py-1 text-[#F9A8D4] hover:text-pink-300 active:scale-95 transition"
      >
        <img src="/icons/user_profile.png" alt="Pasangan" className="w-5 h-5 object-contain" />
        <span className="font-medium tracking-tight">Pasangan</span>
      </button>
    </nav>
  );
}


'use client';

import React from 'react';

export function OceanDecorations() {
  return (
    <>
      {/* =========================================================================
          LEFT SEABED ACCENT
          Semua 3 elemen tampil di Mobile, Tablet, dan Desktop:
          Gua Batu Lengkung (Stone Arch) + Rumput Laut (Seaweed) + Lentera Pagoda
      ========================================================================= */}
      <div 
        className="absolute bottom-0 left-0 translate-y-1 sm:translate-y-2 lg:translate-y-3 lg:-translate-x-3 xl:translate-y-4 xl:-translate-x-5 z-20 pointer-events-none select-none flex items-end"
        aria-hidden="true"
      >
        {/* Gua Batu Karang Lengkung (Stone Arch - Tampil di semua ukuran layar) */}
        <div className="relative -mr-3 sm:-mr-4 mb-0 opacity-95">
          <img
            src="/icons/stone_arch.png?v=hd2"
            alt="Gua Batu Karang HD"
            className="w-14 sm:w-18 lg:w-24 xl:w-26 h-auto object-contain drop-shadow-sm"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        </div>

        {/* Rumput Laut Hijau Zamrud (Seaweed - Bergoyang lembut) */}
        <div className="relative -mr-3 sm:-mr-4 mb-0.5 opacity-95 animate-sway">
          <img
            src="/icons/seaweed.png?v=hd2"
            alt="Rumput Laut HD"
            className="w-9 sm:w-12 lg:w-14 h-auto object-contain drop-shadow-sm"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        </div>

        {/* Lentera Pagoda Batu (Pagoda - Lampu kuning hangat menyala) */}
        <div className="relative z-10 mb-0">
          <img
            src="/icons/pagoda.png?v=hd2"
            alt="Lentera Pagoda HD"
            className="w-11 sm:w-14 lg:w-17 h-auto object-contain drop-shadow-sm"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        </div>
      </div>

      {/* =========================================================================
          RIGHT SEABED ACCENT
          Tampil di Mobile, Tablet, dan Desktop:
          Batu Karang & Anemon (Rock Coral) + Peti Harta Karun Emas (Treasure Chest)
      ========================================================================= */}
      <div 
        className="absolute bottom-0 right-0 translate-y-1 sm:translate-y-2 lg:translate-y-3 lg:translate-x-3 xl:translate-y-4 xl:translate-x-5 z-20 pointer-events-none select-none flex items-end"
        aria-hidden="true"
      >
        {/* Batu Karang Bawah Laut (Rock Coral - Anemon & Coral) */}
        <div className="relative -mr-3 sm:-mr-4 mb-0.5 opacity-95 animate-sway-alt">
          <img
            src="/icons/rock_coral.png?v=hd2"
            alt="Terumbu Karang HD"
            className="w-12 sm:w-15 lg:w-18 h-auto object-contain drop-shadow-sm"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        </div>

        {/* Peti Harta Karun Emas & Bintang Laut (Treasure Chest) */}
        <div className="relative z-10 mb-0">
          <img
            src="/icons/treasure_chest.png?v=hd2"
            alt="Peti Harta Karun HD"
            className="w-13 sm:w-16 lg:w-20 h-auto object-contain drop-shadow-sm"
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        </div>
      </div>
    </>
  );
}

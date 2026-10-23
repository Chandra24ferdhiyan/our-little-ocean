'use client';

import React from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { THEME_LIST } from '@/lib/themes/themeConfig';
import { X, Check, Palette } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { aquarium, changeTheme } = useAquarium();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/30 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-[#E2EAF0] rounded-2xl p-4 sm:p-6 md:p-7 shadow-2xl text-[#182C3A] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EAF0]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2F7] border border-[#CBD7DF] flex items-center justify-center p-1.5 shadow-2xs">
              <img src="/icons/palette.png" alt="Tema" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#182C3A] tracking-wide font-bold">Koleksi 5 Tema Akuarium</h2>
              <p className="text-xs text-[#526A7A]">Pilih atmosfer lingkungan bawah air</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="mt-5 space-y-3">
          {THEME_LIST.map((theme) => {
            const isActive = aquarium.active_theme === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => changeTheme(theme.id)}
                className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                  isActive
                    ? 'bg-[#EBF2F7]/90 border-[#4A6B82] ring-1 ring-[#4A6B82]/50 shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E2EAF0] hover:border-[#CBD7DF] hover:bg-[#F1F5F8]'
                }`}
              >
                {/* Environmental Thumbnail with 3D Squircle Theme Icon */}
                <div
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl shrink-0 overflow-hidden shadow-xs border border-[#CBD7DF] bg-[#07131B] flex items-center justify-center relative mt-0.5"
                >
                  <img
                    src={`/icons/theme_${theme.id.replace('-', '_')}.png`}
                    alt={theme.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content & Action Area */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 pr-1">
                      <h3 className="font-serif text-base text-[#182C3A] font-bold leading-tight">
                        {theme.name}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-semibold text-[#4A6B82] tracking-wider uppercase mt-0.5">
                        {theme.tagline}
                      </p>
                    </div>

                    {/* Action / Status Button */}
                    <div className="shrink-0">
                      {isActive ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#4A6B82] text-white text-xs font-semibold shadow-2xs">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-3.5 py-1 rounded-lg bg-white hover:bg-[#EBF2F7] text-[#182C3A] border border-[#CBD7DF] text-xs font-semibold transition shadow-2xs"
                        >
                          Terapkan
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#526A7A] mt-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-[#E2EAF0] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-90 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

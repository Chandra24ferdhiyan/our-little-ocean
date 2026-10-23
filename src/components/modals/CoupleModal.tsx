'use client';

import React, { useState } from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { 
  Users, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Database,
  Heart,
  Fish
} from 'lucide-react';

interface CoupleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoupleModal({ isOpen, onClose }: CoupleModalProps) {
  const { 
    currentUser, 
    couple, 
    aquarium,
    switchPartner, 
    pairWithInviteCode 
  } = useAquarium();

  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'candut' | 'repa' | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couple.invitation_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = (role: 'candut' | 'repa') => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}?role=${role}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(role);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handlePair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCodeInput.trim()) return;
    const res = pairWithInviteCode(partnerCodeInput);
    setFeedback({ success: res.success, msg: res.message });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/30 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#E2EAF0] rounded-2xl p-4 sm:p-6 md:p-7 shadow-2xl text-[#182C3A] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EAF0]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EBF2F7] to-[#FCE8EE] border border-[#CBD7DF] flex items-center justify-center text-[#4A6B82]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#182C3A] tracking-wide">Profil &amp; Pasangan</h2>
              <p className="text-xs text-[#526A7A]">Satu akuarium abadi untuk berdua</p>
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

        {/* Both Fish Characters */}
        <div className="grid grid-cols-2 gap-3.5 mt-5">
          {/* Candut */}
          <div
            className={`p-4 rounded-xl border text-center transition ${
              currentUser.partner_role === 'candut'
                ? 'bg-[#EBF2F7]/80 border-[#4A6B82] ring-1 ring-[#4A6B82]/50'
                : 'bg-[#F8FAFC] border-[#E2EAF0]'
            }`}
          >
            <div className="w-14 h-14 mx-auto rounded-xl bg-white border border-[#CBD7DF] flex items-center justify-center shadow-2xs p-1.5">
              <img
                src={`/fish/candut_stage${aquarium.current_level >= 401 ? 5 : aquarium.current_level >= 301 ? 4 : aquarium.current_level >= 201 ? 3 : aquarium.current_level >= 101 ? 2 : 1}.png`}
                alt="Candut"
                className="w-full h-full object-contain"
              />
            </div>
            <h4 className="font-serif text-base text-[#182C3A] mt-2 font-semibold">Candut</h4>
            <p className="text-[11px] font-medium text-[#4A6B82]">Ikan Nordic Sea</p>
            {currentUser.partner_role === 'candut' ? (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#4A6B82] text-white shadow-2xs">
                Aktif (Anda)
              </span>
            ) : (
              <button
                onClick={() => switchPartner('candut')}
                className="mt-2 text-[11px] font-semibold text-[#4A6B82] hover:underline flex items-center justify-center mx-auto space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Beralih ke Candut</span>
              </button>
            )}
          </div>

          {/* Repa */}
          <div
            className={`p-4 rounded-xl border text-center transition ${
              currentUser.partner_role === 'repa'
                ? 'bg-[#FCE8EE]/80 border-[#D8738E] ring-1 ring-[#D8738E]/50'
                : 'bg-[#F8FAFC] border-[#E2EAF0]'
            }`}
          >
            <div className="w-14 h-14 mx-auto rounded-xl bg-white border border-[#F3C5D1] flex items-center justify-center shadow-2xs p-1.5">
              <img
                src={`/fish/repa_stage${aquarium.current_level >= 401 ? 5 : aquarium.current_level >= 301 ? 4 : aquarium.current_level >= 201 ? 3 : aquarium.current_level >= 101 ? 2 : 1}.png`}
                alt="Repa"
                className="w-full h-full object-contain"
              />
            </div>
            <h4 className="font-serif text-base text-[#182C3A] mt-2 font-semibold">Repa</h4>
            <p className="text-[11px] font-medium text-[#D8738E]">Ikan Rose Quartz</p>
            {currentUser.partner_role === 'repa' ? (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#D8738E] text-white shadow-2xs">
                Aktif (Anda)
              </span>
            ) : (
              <button
                onClick={() => switchPartner('repa')}
                className="mt-2 text-[11px] font-semibold text-[#D8738E] hover:underline flex items-center justify-center mx-auto space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Beralih ke Repa</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Role Direct Links (WhatsApp / Shareable) */}
        <div className="mt-5 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2EAF0]">
          <label className="block text-xs font-semibold text-[#182C3A] mb-1">
            Tautan Cepat Akses Pasangan (Kirim via Chat/WhatsApp)
          </label>
          <p className="text-[11px] text-[#526A7A] mb-2.5">
            Salin tautan di bawah dan buka di masing-masing perangkat agar peran otomatis terpasang:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCopyLink('candut')}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-2xs ${
                copiedLink === 'candut'
                  ? 'bg-[#EBF2F7] border-[#4A6B82] text-[#4A6B82]'
                  : 'bg-white border-[#CBD7DF] hover:border-[#4A6B82] text-[#4A6B82]'
              }`}
            >
              {copiedLink === 'candut' ? <Check className="w-3.5 h-3.5 text-[#4A6B82]" /> : <Copy className="w-3.5 h-3.5 text-[#4A6B82]" />}
              <span>{copiedLink === 'candut' ? 'Tersalin!' : 'Link Candut'}</span>
            </button>

            <button
              onClick={() => handleCopyLink('repa')}
              className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition active:scale-95 shadow-2xs ${
                copiedLink === 'repa'
                  ? 'bg-[#FCE8EE] border-[#D8738E] text-[#D8738E]'
                  : 'bg-white border-[#CBD7DF] hover:border-[#D8738E] text-[#D8738E]'
              }`}
            >
              {copiedLink === 'repa' ? <Check className="w-3.5 h-3.5 text-[#D8738E]" /> : <Copy className="w-3.5 h-3.5 text-[#D8738E]" />}
              <span>{copiedLink === 'repa' ? 'Tersalin!' : 'Link Repa'}</span>
            </button>
          </div>
        </div>

        {/* Invitation Code */}
        <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2EAF0]">
          <label className="block text-xs font-semibold text-[#182C3A] mb-1.5">
            Kode Undangan Akuarium
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-white border border-[#CBD7DF] rounded-lg font-mono text-sm font-bold text-[#4A6B82] tracking-wider">
              {couple.invitation_code}
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-[#F4F7F9] text-[#182C3A] border border-[#CBD7DF] flex items-center space-x-1.5 text-xs font-semibold transition shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#4A6B82]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#526A7A] mt-1.5">
            Bagikan kode ini kepada pasangan untuk terhubung ke dalam akuarium yang sama.
          </p>
        </div>

        {/* Join with code */}
        <form onSubmit={handlePair} className="mt-4">
          <label className="block text-xs font-semibold text-[#182C3A] mb-1.5">
            Hubungkan dengan Kode Pasangan
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={partnerCodeInput}
              onChange={(e) => setPartnerCodeInput(e.target.value)}
              placeholder="Contoh: OCEAN-LOVE7"
              className="flex-1 px-3 py-2 bg-white border border-[#CBD7DF] rounded-lg text-xs text-[#182C3A] placeholder-[#8A9BA8] focus:outline-none focus:border-[#4A6B82] focus:ring-1 focus:ring-[#4A6B82] uppercase font-mono font-semibold"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-90 text-white text-xs font-semibold rounded-lg transition shadow-xs"
            >
              Hubungkan
            </button>
          </div>
        </form>

        {feedback && (
          <div className="mt-3 p-2.5 rounded-lg text-xs bg-[#EBF2F7] border border-[#CBD7DF] text-[#182C3A] font-medium">
            {feedback.msg}
          </div>
        )}

        {/* Backend Status */}
        <div className="mt-5 pt-3 border-t border-[#E2EAF0] flex items-center justify-between text-[11px] text-[#526A7A]">
          <div className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-[#4A6B82]" />
            <span>
              {isSupabaseConfigured ? 'Supabase PostgreSQL Terhubung' : 'Penyimpanan Persisten Lokal'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F8] text-[#182C3A] border border-[#CBD7DF] font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { SECRET_REWARDS } from '@/lib/level-system/levelConfig';
import { TransactionType } from '@/types/aquarium';
import { X, CheckCircle2 } from 'lucide-react';

interface PelletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PelletModal({ isOpen, onClose }: PelletModalProps) {
  const { 
    aquarium, 
    lastClaimDate, 
    transactions, 
    claimDailyPellet, 
    claimSecretInteraction 
  } = useAquarium();

  const [activeTab, setActiveTab] = useState<'claims' | 'history'>('claims');
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const isDailyClaimed = lastClaimDate === today;

  const handleDailyClaim = async () => {
    const res = await claimDailyPellet();
    setFeedback({ success: res.success, msg: res.message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSecretClaim = async (type: TransactionType, pellets: number, title: string) => {
    const res = await claimSecretInteraction(type, pellets, title);
    setFeedback({ success: res.success, msg: res.message });
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#071118]/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#E2EAF0] rounded-2xl shadow-2xl text-[#182C3A] max-h-[88vh] flex flex-col overflow-hidden">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#E2EAF0] bg-white shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EBF2F7] border border-[#CBD7DF] flex items-center justify-center p-1.5 shadow-2xs shrink-0">
              <img src="/icons/pellet_coin.png" alt="Pelet" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base sm:text-lg text-[#182C3A] tracking-wide font-bold leading-tight truncate">
                Inventaris Pelet
              </h2>
              <p className="text-[11px] sm:text-xs text-[#526A7A] mt-0.5 truncate">
                Saldo saat ini: <strong className="text-[#4A6B82] font-mono font-bold">{aquarium.pellet_balance} pelet</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-xl text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition shrink-0 ml-1.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Responsive, will NEVER overflow or get cut off) */}
        <div className="px-3 sm:px-5 pt-3 bg-white shrink-0">
          <div className="flex space-x-1.5 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2EAF0]">
            <button
              onClick={() => setActiveTab('claims')}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 min-h-[36px] ${
                activeTab === 'claims'
                  ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-xs'
                  : 'text-[#526A7A] hover:text-[#182C3A]'
              }`}
            >
              <img src="/icons/calendar.png" alt="Klaim" className="w-3.5 h-3.5 object-contain shrink-0" />
              <span className="sm:hidden whitespace-nowrap">Klaim Hadiah</span>
              <span className="hidden sm:inline whitespace-nowrap">Klaim Hadiah &amp; Rahasia</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 min-h-[36px] ${
                activeTab === 'history'
                  ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-xs'
                  : 'text-[#526A7A] hover:text-[#182C3A]'
              }`}
            >
              <img src="/icons/eye.png" alt="Riwayat" className="w-3.5 h-3.5 object-contain shrink-0" />
              <span className="sm:hidden whitespace-nowrap">Riwayat ({transactions.length})</span>
              <span className="hidden sm:inline whitespace-nowrap">Riwayat Transaksi ({transactions.length})</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-3 sm:px-5 pt-3 shrink-0">
            <div
              className={`p-3 rounded-xl text-xs font-semibold border flex items-center space-x-2 ${
                feedback.success
                  ? 'bg-[#EBF2F7] border-[#CBD7DF] text-[#182C3A]'
                  : 'bg-[#FFF0F4] border-[#F3C5D1] text-[#D8738E]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4A6B82]" />
              <span>{feedback.msg}</span>
            </div>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Tab 1: Claims & Secrets */}
          {activeTab === 'claims' && (
            <div className="space-y-3.5">
              {/* Daily Login Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2EAF0] space-y-2">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF2F7] border border-[#CBD7DF] flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                      <img src="/icons/calendar.png" alt="Login Harian" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-sm sm:text-base text-[#182C3A] font-bold leading-tight truncate">
                        Login Harian
                      </h3>
                      <div className="mt-0.5">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-[#4A6B82] border border-[#CBD7DF] shadow-2xs whitespace-nowrap">
                          +1 Pelet &bull; +50 XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={isDailyClaimed}
                    onClick={handleDailyClaim}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                      isDailyClaimed
                        ? 'bg-[#E2EAF0] text-[#526A7A] border border-[#CBD7DF] cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-90 text-white shadow-xs active:scale-95'
                    }`}
                  >
                    {isDailyClaimed ? 'Sudah Klaim' : 'Klaim'}
                  </button>
                </div>
                <p className="text-xs text-[#526A7A] leading-relaxed pt-1">
                  Dapat diklaim sekali setiap hari untuk merawat Candut dan Saridut bersama.
                </p>
              </div>

              {/* Secret Interactions Header */}
              <div className="pt-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#182C3A] uppercase tracking-wider">
                  <img src="/icons/heart_lock.png" alt="Privat" className="w-4 h-4 object-contain shrink-0" />
                  <span>Interaksi Privat Pasangan</span>
                </div>
                <p className="text-[11px] text-[#526A7A] mt-0.5">
                  Aktivitas personal berdua yang disepakati secara privat tanpa rincian publik.
                </p>
              </div>

              {/* Secret Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {SECRET_REWARDS.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2EAF0] flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-[#D8738E] border border-[#F3C5D1] whitespace-nowrap shadow-2xs">
                          {sec.badge}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#4A6B82] whitespace-nowrap">
                          +{sec.pellets} Pelet
                        </span>
                      </div>
                      <h4 className="font-serif text-sm text-[#182C3A] font-bold leading-tight">
                        {sec.title}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-[#E2EAF0] flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] text-[#526A7A] flex items-center space-x-1">
                        <img src="/icons/heart_lock.png" alt="Privat" className="w-3.5 h-3.5 object-contain shrink-0" />
                        <span>Privat</span>
                      </span>
                      <button
                        onClick={() => handleSecretClaim(sec.id, sec.pellets, sec.title)}
                        className="px-3 py-1 rounded-lg bg-white hover:bg-[#F4F7F9] text-[#182C3A] border border-[#CBD7DF] text-xs font-semibold transition shadow-2xs active:scale-95 whitespace-nowrap"
                      >
                        Buka Hadiah
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Transaction History */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-[#526A7A] text-xs">
                  Belum ada riwayat transaksi pelet tercatat.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EAF0] flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#CBD7DF] flex items-center justify-center p-1 shrink-0 shadow-2xs">
                        <img src="/icons/pellet.png" alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#182C3A] truncate">{tx.note}</p>
                        <p className="text-[10px] text-[#526A7A]">
                          {new Date(tx.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs shrink-0 whitespace-nowrap ${
                        tx.amount > 0 ? 'text-[#4A6B82]' : 'text-[#D8738E]'
                      }`}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Pelet
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
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

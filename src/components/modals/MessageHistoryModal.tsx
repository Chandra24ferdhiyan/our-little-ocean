'use client';

import React, { useState } from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { BubbleMessage } from '@/types/aquarium';
import { 
  X, 
  History, 
  CheckCheck, 
  Clock, 
  Heart, 
  Sparkles, 
  MessageCircle, 
  LockKeyhole,
  CornerUpLeft
} from 'lucide-react';

interface MessageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (msg: BubbleMessage) => void;
  onReply?: (msg: BubbleMessage) => void;
}

export function MessageHistoryModal({ isOpen, onClose, onSelectMessage, onReply }: MessageHistoryModalProps) {
  const { messages, currentUser } = useAquarium();
  const [filter, setFilter] = useState<'all' | 'read' | 'pending' | 'capsules'>('all');

  if (!isOpen) return null;

  const filteredMessages = messages.filter((m) => {
    if (filter === 'read') return m.status === 'read';
    if (filter === 'pending') return m.status === 'pending';
    if (filter === 'capsules') return !!m.is_capsule;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'love':
        return <Heart className="w-3.5 h-3.5 text-[#D8738E]" />;
      case 'gratitude':
        return <Sparkles className="w-3.5 h-3.5 text-[#4A6B82]" />;
      case 'memory':
        return <Clock className="w-3.5 h-3.5 text-[#EAA77D]" />;
      case 'promise':
        return <LockKeyhole className="w-3.5 h-3.5 text-[#9B7C94]" />;
      default:
        return <MessageCircle className="w-3.5 h-3.5 text-[#4A6B82]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#071118]/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-[#E2EAF0] rounded-2xl p-4 sm:p-6 md:p-7 shadow-2xl text-[#182C3A] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EAF0]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2F7] border border-[#CBD7DF] flex items-center justify-center p-1.5 shadow-2xs">
              <img src="/icons/chat_bubble.png" alt="Pesan Cinta" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#182C3A] tracking-wide font-bold">Riwayat Pesan Cinta</h2>
              <div className="flex items-center space-x-1.5 text-xs text-[#526A7A] mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#4A6B82]" />
                <span>Pesan tersimpan otomatis selama 7 hari</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup riwayat"
            className="p-1.5 rounded-lg text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mt-4 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2EAF0] text-[11px] sm:text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[36px] flex items-center justify-center text-center ${
              filter === 'all'
                ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <span className="truncate">Semua ({messages.length})</span>
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[36px] flex items-center justify-center text-center ${
              filter === 'read'
                ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <span className="truncate">Dibaca ({messages.filter((m) => m.status === 'read').length})</span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[36px] flex items-center justify-center text-center ${
              filter === 'pending'
                ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <span className="truncate">Mengapung ({messages.filter((m) => m.status === 'pending').length})</span>
          </button>
          <button
            onClick={() => setFilter('capsules')}
            className={`py-2 px-1 rounded-lg font-semibold transition min-h-[36px] flex items-center justify-center text-center ${
              filter === 'capsules'
                ? 'bg-white text-[#B45309] border border-[#FDE68A] shadow-xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <span className="truncate">Kapsul ({messages.filter((m) => m.is_capsule).length})</span>
          </button>
        </div>

        {/* Message Archive List */}
        <div className="mt-4 space-y-2.5">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-10 text-[#526A7A] text-xs">
              Belum ada pesan dalam kategori ini.
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isFromMe = msg.sender_id === currentUser.id;
              const formattedDate = new Date(msg.created_at).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    if (msg.status === 'read' || msg.recipient_id === currentUser.id) {
                      onSelectMessage(msg);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    msg.is_capsule
                      ? 'bg-[#FFFDF7] border-[#FDE68A] hover:border-[#D97706]'
                      : msg.status === 'read'
                      ? 'bg-[#F8FAFC] border-[#E2EAF0] hover:border-[#CBD7DF]'
                      : 'bg-[#FFF9FB] border-[#F3C5D1] hover:border-[#D8738E]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      {msg.is_capsule ? (
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <img src="/icons/time_capsule.png" alt="Kapsul" className="w-full h-full object-contain" />
                        </div>
                      ) : msg.audio_url ? (
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <img src="/icons/whisper_voice.png" alt="Suara" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        getCategoryIcon(msg.category || 'love')
                      )}
                      
                      <span className="text-xs font-semibold text-[#182C3A]">
                        {isFromMe
                          ? `Anda kepada ${msg.sender_role === 'candut' ? 'Saridut' : 'Candut'}`
                          : (msg.sender_role === 'repa' || (msg.sender_name && msg.sender_name.toLowerCase().includes('repa')) ? 'Saridut' : msg.sender_name)}
                      </span>

                      {msg.is_capsule && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                          Kapsul
                        </span>
                      )}
                      {msg.audio_url && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FCE8EE] text-[#D8738E] border border-[#F3C5D1]">
                          Suara
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 text-[11px]">
                      {msg.status === 'read' ? (
                        <span className="flex items-center space-x-1 text-[#4A6B82] font-medium">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Sudah Dibaca</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-[#D8738E] font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{msg.is_capsule ? 'Menunggu Waktu' : 'Belum Dibuka'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quoted Message in History */}
                  {msg.reply_to_message && (
                    <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-[#EBF2F7]/90 border-l-3 border-[#4A6B82] text-[11px] text-[#526A7A]">
                      <div className="flex items-center space-x-1 text-[#4A6B82] font-semibold text-[10px] mb-0.5">
                        <CornerUpLeft className="w-3 h-3" />
                        <span>Membalas {msg.reply_to_sender_name || 'pesan'}:</span>
                      </div>
                      <p className="italic line-clamp-1 text-[#526A7A]">
                        &ldquo;{msg.reply_to_message}&rdquo;
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-[#526A7A] line-clamp-2 leading-relaxed">
                    {msg.status === 'read' || msg.recipient_id === currentUser.id || isFromMe
                      ? msg.message
                      : 'Pesan privat sedang mengapung di akuarium.'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#526A7A] mt-2 pt-1.5 border-t border-black/5 font-mono">
                    <span>{formattedDate}</span>
                    {onReply && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onReply(msg);
                        }}
                        title="Balas pesan ini"
                        className="px-2.5 py-1 rounded-lg bg-[#EBF2F7] hover:bg-[#DDE8F0] text-[#4A6B82] border border-[#CBD7DF] text-[11px] font-semibold flex items-center space-x-1 transition active:scale-95 shadow-2xs font-sans"
                      >
                        <CornerUpLeft className="w-3 h-3" />
                        <span>Balas</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-[#E2EAF0] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#F8FAFC] hover:bg-[#F1F5F8] text-[#182C3A] text-xs font-semibold rounded-xl border border-[#CBD7DF] transition shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

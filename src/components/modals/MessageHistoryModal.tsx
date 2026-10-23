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
  LockKeyhole 
} from 'lucide-react';

interface MessageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (msg: BubbleMessage) => void;
}

export function MessageHistoryModal({ isOpen, onClose, onSelectMessage }: MessageHistoryModalProps) {
  const { messages, currentUser } = useAquarium();
  const [filter, setFilter] = useState<'all' | 'read' | 'pending'>('all');

  if (!isOpen) return null;

  const filteredMessages = messages.filter((m) => {
    if (filter === 'read') return m.status === 'read';
    if (filter === 'pending') return m.status === 'pending';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/30 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-[#E2EAF0] rounded-2xl p-4 sm:p-6 md:p-7 shadow-2xl text-[#182C3A] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EAF0]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF2F7] border border-[#CBD7DF] flex items-center justify-center p-1.5 shadow-2xs">
              <img src="/icons/chat_bubble.png" alt="Pesan Cinta" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#182C3A] tracking-wide">Riwayat Pesan Cinta</h2>
              <p className="text-xs text-[#526A7A]">Arsip kenangan dan pesan gelembung</p>
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
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2EAF0] text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-1.5 rounded-lg font-semibold transition min-h-[36px] flex items-center justify-center text-center ${
              filter === 'all'
                ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <span className="truncate">Semua ({messages.length})</span>
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`py-2 px-1.5 rounded-lg font-semibold transition min-h-[36px] flex items-center justify-center text-center ${
              filter === 'read'
                ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <span className="truncate">Dibaca ({messages.filter((m) => m.status === 'read').length})</span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`py-2 px-1.5 rounded-lg font-semibold transition min-h-[36px] flex items-center justify-center text-center ${
              filter === 'pending'
                ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <span className="truncate">Akuarium ({messages.filter((m) => m.status === 'pending').length})</span>
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
                    msg.status === 'read'
                      ? 'bg-[#F8FAFC] border-[#E2EAF0] hover:border-[#CBD7DF]'
                      : 'bg-[#FFF9FB] border-[#F3C5D1] hover:border-[#D8738E]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(msg.category || 'love')}
                      <span className="text-xs font-semibold text-[#182C3A]">
                        {isFromMe ? `Anda kepada ${msg.sender_role === 'candut' ? 'Saridut' : 'Candut'}` : msg.sender_name}
                      </span>
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
                          <span>Belum Dibuka</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#526A7A] line-clamp-2 leading-relaxed">
                    {msg.status === 'read' || msg.recipient_id === currentUser.id || isFromMe
                      ? msg.message
                      : 'Pesan privat sedang mengapung di akuarium.'}
                  </p>

                  <div className="text-right text-[10px] text-[#526A7A] mt-1.5 font-mono">
                    {formattedDate}
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

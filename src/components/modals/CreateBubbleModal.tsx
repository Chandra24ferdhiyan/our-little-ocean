'use client';

import React, { useState } from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { MessageCategory } from '@/types/aquarium';
import { 
  X, 
  Send, 
  Heart, 
  Sparkles, 
  Clock, 
  MessageCircle, 
  LockKeyhole,
  CircleAlert
} from 'lucide-react';

interface CreateBubbleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: MessageCategory; label: string; icon: React.ElementType }[] = [
  { id: 'love', label: 'Cinta & Kasih', icon: Heart },
  { id: 'gratitude', label: 'Apresiasi', icon: Sparkles },
  { id: 'daily', label: 'Perhatian Hari Ini', icon: Clock },
  { id: 'memory', label: 'Kenangan Bersama', icon: MessageCircle },
  { id: 'promise', label: 'Janji & Harapan', icon: LockKeyhole },
];

const COLOR_OPTIONS = [
  { id: 'bubble-rose', name: 'Rose Quartz', hex: '#D8738E' },
  { id: 'bubble-teal', name: 'Nordic Sea', hex: '#4A6B82' },
  { id: 'bubble-slate', name: 'Pearl Mist', hex: '#8FA6B5' },
  { id: 'bubble-amber', name: 'Morning Glow', hex: '#EAA77D' },
];

export function CreateBubbleModal({ isOpen, onClose }: CreateBubbleModalProps) {
  const { partnerUser, createBubbleMessage } = useAquarium();
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>('love');
  const [selectedColor, setSelectedColor] = useState('bubble-rose');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Tuliskan pesan cinta atau catatan manismu terlebih dahulu.');
      return;
    }

    const res = createBubbleMessage(message, selectedColor, selectedCategory);
    if (res.success) {
      setMessage('');
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/30 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#E2EAF0] rounded-2xl p-4 sm:p-6 md:p-7 shadow-2xl text-[#182C3A] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EAF0]">
          <div>
            <h2 className="font-serif text-xl text-[#182C3A] tracking-wide">Tulis Pesan Gelembung</h2>
            <p className="text-xs text-[#D8738E] mt-0.5 font-medium">
              Ditujukan khusus untuk {partnerUser.display_name}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-[#FFF0F4] border border-[#F3C5D1] rounded-xl text-[#D8738E] flex items-center space-x-2">
              <CircleAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Text Area */}
          <div>
            <label className="block text-xs font-semibold text-[#182C3A] mb-1.5">
              Isi Pesan (Maksimal 500 karakter)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Tuliskan apresiasi, pengingat hari ini, atau kata-kata kasih untuk pasanganmu..."
              className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#CBD7DF] rounded-xl text-sm text-[#182C3A] placeholder-[#8A9BA8] focus:outline-none focus:border-[#4A6B82] focus:ring-1 focus:ring-[#4A6B82] transition resize-none"
            />
            <div className="text-right text-[11px] text-[#526A7A] mt-1 font-mono">
              {message.length} / 500
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#182C3A] mb-2">
              Kategori Pesan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs transition ${
                      isSelected
                        ? 'bg-[#EBF2F7] border-[#4A6B82] text-[#182C3A] font-semibold'
                        : 'bg-[#F8FAFC] border-[#E2EAF0] text-[#526A7A] hover:bg-[#F1F5F8]'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-[#4A6B82]' : 'text-[#526A7A]'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palettes */}
          <div>
            <label className="block text-xs font-semibold text-[#182C3A] mb-2">
              Nuansa Kaca Gelembung
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs transition ${
                    selectedColor === c.id
                      ? 'bg-[#FCE8EE] border-[#D8738E] text-[#182C3A] font-semibold'
                      : 'bg-[#F8FAFC] border-[#E2EAF0] text-[#526A7A] hover:bg-[#F1F5F8]'
                  }`}
                >
                  <span
                    style={{ backgroundColor: c.hex }}
                    className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                  />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-[#E2EAF0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#526A7A] hover:text-[#182C3A] hover:bg-[#F4F7F9] transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-90 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Lepaskan Gelembung</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

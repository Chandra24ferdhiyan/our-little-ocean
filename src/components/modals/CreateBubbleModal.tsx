'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  CircleAlert,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Hourglass,
  Calendar,
  Volume2
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
  
  // Message mode: 'text' | 'voice'
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>('love');
  const [selectedColor, setSelectedColor] = useState('bubble-rose');
  const [errorMsg, setErrorMsg] = useState('');

  // Feature #2: Deep Sea Time Capsule
  const [isCapsule, setIsCapsule] = useState(false);
  const [unlockDate, setUnlockDate] = useState<string>('');

  useEffect(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setUnlockDate(d.toISOString().slice(0, 16));
  }, []);

  // Feature #3: Voice Note / Whisper
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    };
  }, [audioBlobUrl]);

  if (!isOpen) return null;

  const handleStartRecording = async () => {
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Browser Anda belum mendukung perekaman suara.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= 29) {
            handleStopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone error:', err);
      setErrorMsg('Mohon izinkan akses mikrofon untuk merekam bisikan suara.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const handleResetRecording = () => {
    handleStopRecording();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setAudioBlobUrl(null);
    setAudioBase64(null);
    setRecordDuration(0);
    setIsPlayingPreview(false);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current && audioBlobUrl) {
      previewAudioRef.current = new Audio(audioBlobUrl);
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (previewAudioRef.current) {
      if (isPlayingPreview) {
        previewAudioRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        previewAudioRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  const setPresetUnlock = (hours: number) => {
    const d = new Date(Date.now() + hours * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setUnlockDate(d.toISOString().slice(0, 16));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'text' && !message.trim()) {
      setErrorMsg('Tuliskan pesan cinta atau catatan manismu terlebih dahulu.');
      return;
    }

    if (activeTab === 'voice' && !audioBase64) {
      setErrorMsg('Rekam bisikan suaramu terlebih dahulu sebelum mengirim.');
      return;
    }

    if (isCapsule) {
      const unlockTime = new Date(unlockDate).getTime();
      if (isNaN(unlockTime) || unlockTime <= Date.now()) {
        setErrorMsg('Waktu pembukaan kapsul harus berada di masa depan.');
        return;
      }
    }

    const res = createBubbleMessage(
      message, 
      selectedColor, 
      selectedCategory,
      {
        is_capsule: isCapsule,
        unlock_at: isCapsule ? new Date(unlockDate).toISOString() : null,
        audio_url: activeTab === 'voice' ? audioBase64 : null,
        audio_duration: activeTab === 'voice' ? recordDuration : null,
      }
    );

    if (res.success) {
      setMessage('');
      setErrorMsg('');
      handleResetRecording();
      setIsCapsule(false);
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#182C3A]/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#E2EAF0] rounded-2xl p-4 sm:p-6 md:p-7 shadow-2xl text-[#182C3A] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E2EAF0]">
          <div>
            <h2 className="font-serif text-xl text-[#182C3A] tracking-wide font-bold">Tulis Pesan Cinta</h2>
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

        {/* Tab Selector: Teks vs Bisikan Suara */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-[#F8FAFC] rounded-xl border border-[#E2EAF0] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${
              activeTab === 'text'
                ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-2xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#4A6B82]" />
            <span>Surat Gelembung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`py-2 px-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${
              activeTab === 'voice'
                ? 'bg-white text-[#182C3A] border border-[#CBD7DF] shadow-2xs'
                : 'text-[#526A7A] hover:text-[#182C3A]'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#D8738E]" />
            <span>Bisikan Suara (Voice Note)</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-[#FFF0F4] border border-[#F3C5D1] rounded-xl text-[#D8738E] flex items-center space-x-2">
              <CircleAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Text Message Field */}
          {activeTab === 'text' ? (
            <div>
              <label className="block text-xs font-semibold text-[#182C3A] mb-1.5">
                Isi Surat Manis (Maksimal 500 karakter)
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
          ) : (
            /* Voice Note / Whisper Studio */
            <div className="p-4 bg-[#FFF9FB] border border-[#F3C5D1] rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <img src="/icons/whisper_voice.png" alt="Bisikan Suara" className="w-8 h-8 object-contain shrink-0 drop-shadow-xs" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#182C3A] truncate">Studio Bisikan Suara Bawah Air</h4>
                    <p className="text-[10px] text-[#526A7A] truncate">Rekam pesan audio hingga 30 detik</p>
                  </div>
                </div>

                <div className="shrink-0 text-xs font-mono font-bold text-[#D8738E] px-2.5 py-1 rounded-lg bg-white border border-[#F3C5D1] shadow-2xs whitespace-nowrap">
                  00:{recordDuration < 10 ? `0${recordDuration}` : recordDuration} / 00:30
                </div>
              </div>

              {/* Recorder Controls */}
              <div className="flex items-center justify-center gap-3 py-2">
                {!isRecording && !audioBlobUrl && (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#D8738E] hover:bg-[#c9627e] text-white font-semibold text-xs shadow-md transition active:scale-95"
                  >
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span>Mulai Rekam Suara</span>
                  </button>
                )}

                {isRecording && (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#b91c1c] text-white font-semibold text-xs shadow-md transition active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Selesai Merekam</span>
                  </button>
                )}

                {audioBlobUrl && (
                  <div className="flex items-center space-x-2 w-full justify-between">
                    <button
                      type="button"
                      onClick={togglePreviewPlay}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#4A6B82] text-white text-xs font-semibold hover:bg-[#3d596c] transition shadow-xs"
                    >
                      {isPlayingPreview ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Jeda</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Dengarkan Rekaman</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetRecording}
                      className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-white border border-[#CBD7DF] text-[#526A7A] hover:text-[#182C3A] text-xs font-medium transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rekam Ulang</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Optional Text Caption with Voice */}
              <div>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={120}
                  placeholder="Catatan manis untuk suara ini (opsional)..."
                  className="w-full px-3.5 py-2 bg-white border border-[#CBD7DF] rounded-xl text-xs text-[#182C3A] placeholder-[#8A9BA8] focus:outline-none focus:border-[#D8738E] transition"
                />
              </div>
            </div>
          )}

          {/* Feature #2: Deep Sea Time Capsule Toggle */}
          <div className="p-3.5 rounded-xl border border-[#CBD7DF] bg-[#F8FAFC]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <img src="/icons/time_capsule.png" alt="Kapsul Waktu" className="w-8 h-8 object-contain shrink-0 drop-shadow-xs" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#182C3A] truncate">Kapsul Waktu Laut Dalam</h4>
                  <p className="text-[10px] text-[#526A7A] truncate">Kunci pesan hingga tanggal rahasia</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isCapsule}
                  onChange={(e) => setIsCapsule(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#CBD7DF] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A6B82]"></div>
              </label>
            </div>

            {isCapsule && (
              <div className="mt-3 pt-3 border-t border-[#E2EAF0] space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-semibold text-[#182C3A]">
                  <span className="flex items-center space-x-1.5">
                    <Hourglass className="w-3.5 h-3.5 text-[#EAA77D]" />
                    <span>Waktu Terbuka Kapsul</span>
                  </span>
                </div>

                {/* Preset Options */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPresetUnlock(24)}
                    className="py-1 px-2 rounded-lg bg-white border border-[#CBD7DF] text-[#182C3A] hover:bg-[#EBF2F7] transition font-medium"
                  >
                    Besok Pagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetUnlock(72)}
                    className="py-1 px-2 rounded-lg bg-white border border-[#CBD7DF] text-[#182C3A] hover:bg-[#EBF2F7] transition font-medium"
                  >
                    3 Hari Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetUnlock(168)}
                    className="py-1 px-2 rounded-lg bg-white border border-[#CBD7DF] text-[#182C3A] hover:bg-[#EBF2F7] transition font-medium"
                  >
                    1 Minggu Lagi
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#526A7A] shrink-0" />
                  <input
                    type="datetime-local"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#CBD7DF] rounded-xl text-xs text-[#182C3A] focus:outline-none focus:border-[#4A6B82]"
                  />
                </div>
                <p className="text-[10px] text-[#526A7A] leading-relaxed">
                  Kapsul akan bersemayam di dasar pasir akuarium. Pasanganmu baru dapat membukanya setelah hitung mundur selesai.
                </p>
              </div>
            )}
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
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#4A6B82] to-[#D8738E] hover:opacity-90 text-white text-xs font-semibold rounded-xl transition shadow-xs active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isCapsule 
                  ? 'Kunci Kapsul Waktu' 
                  : activeTab === 'voice' 
                  ? 'Lepaskan Bisikan Suara' 
                  : 'Lepaskan Gelembung'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

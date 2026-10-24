// Web Audio API Procedural Sound Synthesizer
// Clean, low-latency, legal, and works without external media files

let audioCtx: AudioContext | null = null;
let isMuted: boolean = false;
let globalVolume: number = 0.7;
let bgMusic: HTMLAudioElement | null = null;
let musicInitialized: boolean = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Initialize and play romantic aquarium background music
 */
export function initRomanticMusic() {
  if (typeof window === 'undefined') return;
  if (!bgMusic) {
    bgMusic = new Audio('/audio/aquarium_romance.wav');
    bgMusic.loop = true;
    bgMusic.preload = 'auto';
  }

  if (!musicInitialized) {
    musicInitialized = true;
    // Set up user interaction listeners to satisfy browser autoplay requirements
    const startAudioOnGesture = () => {
      if (bgMusic && !isMuted) {
        bgMusic.volume = 0.35 * globalVolume;
        bgMusic.play().catch(() => {});
      }
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
      window.removeEventListener('touchstart', startAudioOnGesture);
    };

    window.addEventListener('pointerdown', startAudioOnGesture, { once: true });
    window.addEventListener('keydown', startAudioOnGesture, { once: true });
    window.addEventListener('touchstart', startAudioOnGesture, { once: true });
  }

  if (!isMuted) {
    bgMusic.volume = 0.35 * globalVolume;
    bgMusic.play().catch(() => {
      // Autoplay blocked until gesture; listener above handles it
    });
  }
}

export function setVolume(vol: number) {
  globalVolume = Math.max(0, Math.min(1, vol));
  if (bgMusic && !isMuted) {
    bgMusic.volume = 0.35 * globalVolume;
  }
}

export function getVolume(): number {
  return globalVolume;
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (!bgMusic) {
    initRomanticMusic();
  }
  if (bgMusic) {
    if (isMuted) {
      bgMusic.pause();
    } else {
      bgMusic.volume = 0.35 * globalVolume;
      bgMusic.play().catch(() => {});
    }
  }
  return isMuted;
}

export function setMute(muted: boolean) {
  isMuted = muted;
  if (bgMusic) {
    if (isMuted) {
      bgMusic.pause();
    } else {
      bgMusic.volume = 0.35 * globalVolume;
      bgMusic.play().catch(() => {});
    }
  }
}

export function getIsMuted(): boolean {
  return isMuted;
}

/**
 * Procedural Glass Tap Sound:
 * Simulates tapping on clear aquarium glass: high ping with warm liquid body resonance.
 */
export function playTapGlassSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.35 * globalVolume, now);
  master.connect(ctx.destination);

  // High glass ping
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1450, now);
  osc1.frequency.exponentialRampToValueAtTime(800, now + 0.12);
  gain1.gain.setValueAtTime(0.8, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc1.connect(gain1);
  gain1.connect(master);
  osc1.start(now);
  osc1.stop(now + 0.13);

  // Sub water resonance
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(420, now);
  osc2.frequency.exponentialRampToValueAtTime(180, now + 0.18);
  gain2.gain.setValueAtTime(0.5, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc2.connect(gain2);
  gain2.connect(master);
  osc2.start(now);
  osc2.stop(now + 0.19);
}

/**
 * Procedural Bubble Pop Sound:
 * Cute, soft liquid pop when opening a romantic bubble message.
 */
export function playBubblePopSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.4 * globalVolume, now);
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Pitch sweep upward then quick pop release
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.7, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.13);
}

/**
 * Procedural Feeding Sound:
 * Gentle splash / food sinking sound with bubbles.
 */
export function playFeedSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.3 * globalVolume, now);
  master.connect(ctx.destination);

  // Plop 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(650, now);
  osc1.frequency.exponentialRampToValueAtTime(320, now + 0.09);
  gain1.gain.setValueAtTime(0.6, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  osc1.connect(gain1);
  gain1.connect(master);
  osc1.start(now);
  osc1.stop(now + 0.1);

  // Plop 2 (delayed subtle ripple)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(800, now + 0.06);
  osc2.frequency.exponentialRampToValueAtTime(400, now + 0.14);
  gain2.gain.setValueAtTime(0.4, now + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc2.connect(gain2);
  gain2.connect(master);
  osc2.start(now + 0.06);
  osc2.stop(now + 0.16);
}

/**
 * Milestone / Level Up Celebration Chime:
 * Romantic crystalline chord (C - E - G - B - C) with shimmering delay.
 */
export function playMilestoneSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.35 * globalVolume, now);
  master.connect(ctx.destination);

  const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteTime = now + idx * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.01, noteTime);
    gain.gain.linearRampToValueAtTime(0.4, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

    osc.connect(gain);
    gain.connect(master);
    osc.start(noteTime);
    osc.stop(noteTime + 0.65);
  });
}

/**
 * Procedural Time Capsule Unlock Sound:
 * Grand ethereal chord with deep resonant underwater chime
 */
export function playCapsuleUnlockSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.4 * globalVolume, now);
  master.connect(ctx.destination);

  // Deep underwater bell resonance
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(196, now); // G3
  subGain.gain.setValueAtTime(0.5, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  subOsc.connect(subGain);
  subGain.connect(master);
  subOsc.start(now);
  subOsc.stop(now + 1.2);

  // Shimmering celestial glockenspiel arpeggio
  const notes = [392.00, 493.88, 587.33, 783.99, 987.77, 1174.66]; // G4, B4, D5, G5, B5, D6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteTime = now + 0.1 + idx * 0.07;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.01, noteTime);
    gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);

    osc.connect(gain);
    gain.connect(master);
    osc.start(noteTime);
    osc.stop(noteTime + 0.85);
  });
}

/**
 * Procedural Voice Note / Whisper Start Sound:
 * Intimate warm bubble whoosh when opening audio voice note
 */
export function playWhisperVoiceSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.3 * globalVolume, now);
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // A4 to E5

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.26);
}


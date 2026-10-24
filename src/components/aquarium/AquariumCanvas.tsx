'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAquarium } from '@/lib/store/AquariumContext';
import { AQUARIUM_THEMES } from '@/lib/themes/themeConfig';
import { playTapGlassSound } from '@/lib/audio/soundEffects';
import { DayTimeMode } from '@/types/aquarium';
import {
  SimFish,
  TapRipple,
  AmbientParticle,
  FoodPellet,
} from '@/components/fish/FishSimulation';

export function getCurrentDayPhase(mode: DayTimeMode): {
  phase: 'dawn' | 'day' | 'sunset' | 'night';
  label: string;
  icon: string;
} {
  if (mode !== 'auto') {
    switch (mode) {
      case 'dawn': return { phase: 'dawn', label: 'Fajar', icon: '🌅' };
      case 'day': return { phase: 'day', label: 'Siang', icon: '☀️' };
      case 'sunset': return { phase: 'sunset', label: 'Senja', icon: '🌇' };
      case 'night': return { phase: 'night', label: 'Malam', icon: '🌙' };
    }
  }
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  if (h >= 5.0 && h < 7.0) {
    return { phase: 'dawn', label: 'Fajar', icon: '🌅' };
  }
  if (h >= 7.0 && h < 16.5) {
    return { phase: 'day', label: 'Siang', icon: '☀️' };
  }
  if (h >= 16.5 && h < 18.75) {
    return { phase: 'sunset', label: 'Senja', icon: '🌇' };
  }
  return { phase: 'night', label: 'Malam', icon: '🌙' };
}

interface AquariumCanvasProps {
  onTapLocation?: (x: number, y: number) => void;
}

export function AquariumCanvas({ onTapLocation }: AquariumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { aquarium, droppedPellets, consumePellet, dayTimeMode, setDayTimeMode } = useAquarium();
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);

  const simState = useRef<{
    candut: SimFish;
    repa: SimFish;
    ripples: TapRipple[];
    particles: AmbientParticle[];
    nightPlankton: { x: number; y: number; r: number; alpha: number; speedY: number; speedX: number; color: string }[];
    pellets: FoodPellet[];
    lastTap: { x: number; y: number; active: boolean; timer: number } | null;
    causticOffset: number;
    plantPhase: number;
  }>({
    candut: new SimFish('candut', 220, 260),
    repa: new SimFish('repa', 460, 280),
    ripples: [],
    particles: [],
    nightPlankton: [],
    pellets: [],
    lastTap: null,
    causticOffset: 0,
    plantPhase: 0,
  });

  const themeAssetsRef = useRef<Record<string, HTMLImageElement>>({});
  const fishSpritesRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    // Preload theme backgrounds
    Object.values(AQUARIUM_THEMES).forEach((t) => {
      if (t.bgImage && !themeAssetsRef.current[t.id]) {
        const img = new Image();
        img.src = t.bgImage;
        themeAssetsRef.current[t.id] = img;
      }
    });

    // Preload all 5 evolutionary stages of Candut & Repa sprites with cache-busting version
    for (let stage = 1; stage <= 5; stage++) {
      const cKey = `candut_${stage}`;
      if (!fishSpritesRef.current[cKey]) {
        const cImg = new Image();
        cImg.src = `/fish/candut_stage${stage}.png?v=2`;
        fishSpritesRef.current[cKey] = cImg;
      }

      const rKey = `repa_${stage}`;
      if (!fishSpritesRef.current[rKey]) {
        const rImg = new Image();
        rImg.src = `/fish/repa_stage${stage}.png?v=2`;
        fishSpritesRef.current[rKey] = rImg;
      }
    }
  }, []);

  useEffect(() => {
    if (!droppedPellets || droppedPellets.length === 0) return;
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width / (window.devicePixelRatio || 1) : 600;

    droppedPellets.forEach((p) => {
      if (!simState.current.pellets.some((sp) => sp.id === p.id)) {
        simState.current.pellets.push({
          id: p.id,
          x: (p.x / 100) * width,
          y: 28,
          vy: 1.5,
          vx: 0,
          size: 4.5,
          eaten: false,
        });
      }
    });
  }, [droppedPellets]);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      playTapGlassSound();

      simState.current.ripples.push({
        x,
        y,
        radius: 4,
        maxRadius: 48,
        alpha: 0.75,
      });

      // Spawn 3 subtle rising micro-bubbles at tap point
      for (let i = 0; i < 3; i++) {
        simState.current.particles.push({
          x: x + (i - 1) * 6,
          y: y + (i - 1) * 4,
          size: 2.2 + i * 0.8,
          speedY: -(1.1 + i * 0.3),
          speedX: (i - 1) * 0.2,
          alpha: 0.65,
        });
      }

      simState.current.lastTap = {
        x,
        y,
        active: true,
        timer: Date.now() + 2200,
      };

      if (onTapLocation) {
        onTapLocation(x, y);
      }
    },
    [onTapLocation]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    // Seed 18 subtle, atmospheric ambient bubbles
    if (simState.current.particles.length === 0) {
      const rect = container.getBoundingClientRect();
      for (let i = 0; i < 18; i++) {
        simState.current.particles.push({
          x: Math.random() * (rect.width || 800),
          y: Math.random() * (rect.height || 500),
          size: 2.5 + (i % 4) * 1.2,
          speedY: -(0.35 + (i % 3) * 0.25),
          speedX: Math.sin(i) * 0.2,
          alpha: 0.25 + (i % 4) * 0.12,
        });
      }
    }

    // Seed 25 bioluminescent night plankton
    if (simState.current.nightPlankton.length === 0) {
      const colors = ['#5EEAD4', '#99F6E4', '#F472B6', '#C084FC', '#67E8F9'];
      for (let i = 0; i < 25; i++) {
        simState.current.nightPlankton.push({
          x: Math.random() * 800,
          y: Math.random() * 500,
          r: 1.2 + Math.random() * 1.8,
          alpha: 0.35 + Math.random() * 0.45,
          speedY: -(0.12 + Math.random() * 0.18),
          speedX: (Math.random() - 0.5) * 0.2,
          color: colors[i % colors.length],
        });
      }
    }

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      if (width <= 0 || height <= 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Always reset transform to identity and clear the ENTIRE physical canvas buffer
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Now scale coordinates for crisp subpixel rendering
      ctx.scale(dpr, dpr);

      const theme = AQUARIUM_THEMES[aquarium.active_theme] || AQUARIUM_THEMES['ocean-dream'];
      const level = aquarium.current_level;
      const dayInfo = getCurrentDayPhase(dayTimeMode);
      const phase = dayInfo.phase;

      // --- 1. Background Environmental Artwork ---
      const activeThemeImg = themeAssetsRef.current[theme.id];
      const hasThemeImg = activeThemeImg && activeThemeImg.complete && activeThemeImg.naturalWidth > 0;

      if (hasThemeImg) {
        // Draw image cover-fit to fill canvas smoothly
        const imgAspect = activeThemeImg.naturalWidth / activeThemeImg.naturalHeight;
        const canvasAspect = width / height;
        let drawW = width;
        let drawH = height;
        let drawX = 0;
        let drawY = 0;
        if (canvasAspect > imgAspect) {
          drawH = width / imgAspect;
          drawY = (height - drawH) / 2;
        } else {
          drawW = height * imgAspect;
          drawX = (width - drawW) / 2;
        }
        ctx.drawImage(activeThemeImg, drawX, drawY, drawW, drawH);

        // Environmental atmospheric tint
        ctx.fillStyle = theme.waterTint;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Fallback procedural depth gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (theme.id === 'ocean-dream') {
          bgGrad.addColorStop(0, '#89C4DE');
          bgGrad.addColorStop(0.45, '#62A8CB');
          bgGrad.addColorStop(1, '#3B7E9F');
        } else if (theme.id === 'love-lagoon') {
          bgGrad.addColorStop(0, '#F8C8D6');
          bgGrad.addColorStop(0.45, '#E59FB5');
          bgGrad.addColorStop(1, '#B86B84');
        } else if (theme.id === 'zen-garden') {
          bgGrad.addColorStop(0, '#8ECBB2');
          bgGrad.addColorStop(0.45, '#5DAE8E');
          bgGrad.addColorStop(1, '#3A8267');
        } else if (theme.id === 'midnight-ocean') {
          bgGrad.addColorStop(0, '#557B99');
          bgGrad.addColorStop(0.45, '#3B5E78');
          bgGrad.addColorStop(1, '#243F54');
        } else {
          bgGrad.addColorStop(0, '#F5BFA2');
          bgGrad.addColorStop(0.45, '#E29871');
          bgGrad.addColorStop(1, '#B06138');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // --- 1.1 Dynamic Day/Night Lighting Wash (Feature #6) ---
      if (phase === 'dawn') {
        const dawnGrad = ctx.createLinearGradient(0, 0, width, height);
        dawnGrad.addColorStop(0, 'rgba(255, 185, 150, 0.20)');
        dawnGrad.addColorStop(0.5, 'rgba(240, 200, 180, 0.10)');
        dawnGrad.addColorStop(1, 'rgba(180, 140, 160, 0.08)');
        ctx.fillStyle = dawnGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (phase === 'sunset') {
        const sunsetGrad = ctx.createLinearGradient(0, 0, 0, height);
        sunsetGrad.addColorStop(0, 'rgba(255, 130, 60, 0.24)');
        sunsetGrad.addColorStop(0.5, 'rgba(216, 115, 142, 0.16)');
        sunsetGrad.addColorStop(1, 'rgba(120, 50, 80, 0.14)');
        ctx.fillStyle = sunsetGrad;
        ctx.fillRect(0, 0, width, height);
      } else if (phase === 'night') {
        const nightGrad = ctx.createLinearGradient(0, 0, 0, height);
        nightGrad.addColorStop(0, 'rgba(10, 22, 50, 0.48)');
        nightGrad.addColorStop(0.6, 'rgba(7, 16, 38, 0.44)');
        nightGrad.addColorStop(1, 'rgba(4, 10, 24, 0.52)');
        ctx.fillStyle = nightGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // --- 2. Dynamic Moving Caustic Sunbeams (Shimmer Waves with Day/Night Tints) ---
      simState.current.causticOffset += 0.012;
      const cOffset = simState.current.causticOffset;

      let causticRayColor = theme.causticsColor;
      if (phase === 'dawn') {
        causticRayColor = 'rgba(255, 220, 190, 0.42)';
      } else if (phase === 'sunset') {
        causticRayColor = 'rgba(255, 195, 120, 0.48)';
      } else if (phase === 'night') {
        causticRayColor = 'rgba(190, 220, 255, 0.22)';
      }

      ctx.save();
      for (let i = 0; i < 4; i++) {
        const rayX = (width * 0.28 * i + Math.sin(cOffset + i * 1.3) * 28 + width * 0.12) % width;
        const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + 60, height);
        rayGrad.addColorStop(0, causticRayColor);
        rayGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(rayX - 18, 0);
        ctx.lineTo(rayX + 50, 0);
        ctx.lineTo(rayX + 90, height);
        ctx.lineTo(rayX - 45, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // --- 2.1 Bioluminescent Night Plankton (Firefly Motes at Night) ---
      if (phase === 'night') {
        ctx.save();
        simState.current.nightPlankton.forEach((p) => {
          p.y += p.speedY;
          p.x += p.speedX;
          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;

          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * (0.6 + Math.sin(cOffset * 3 + p.x) * 0.4);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      const sandHeight = 48;

      // Only draw procedural sand & plants if artwork image is not yet loaded
      if (!hasThemeImg) {
        // --- 3. Seabed Sand & Natural Layered Terrain (Luminous Pearl Sand) ---
        const sandY = height - sandHeight;
        const sandGrad = ctx.createLinearGradient(0, sandY, 0, height);
        if (theme.id === 'ocean-dream') {
          sandGrad.addColorStop(0, '#FFFDF7');
          sandGrad.addColorStop(0.4, '#F4EFE6');
          sandGrad.addColorStop(1, '#DECBB7');
        } else if (theme.id === 'love-lagoon') {
          sandGrad.addColorStop(0, '#FFF5F8');
          sandGrad.addColorStop(0.4, '#F7DFE6');
          sandGrad.addColorStop(1, '#DCB2BE');
        } else if (theme.id === 'zen-garden') {
          sandGrad.addColorStop(0, '#FAFCF9');
          sandGrad.addColorStop(0.4, '#E3ECE4');
          sandGrad.addColorStop(1, '#B8C8B9');
        } else if (theme.id === 'midnight-ocean') {
          sandGrad.addColorStop(0, '#D6E3EC');
          sandGrad.addColorStop(0.4, '#A8BDCB');
          sandGrad.addColorStop(1, '#6E889A');
        } else {
          sandGrad.addColorStop(0, '#FFF7F0');
          sandGrad.addColorStop(0.4, '#F5E0CF');
          sandGrad.addColorStop(1, '#D6B598');
        }

        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, sandY + 8);
        ctx.bezierCurveTo(width * 0.28, sandY - 6, width * 0.52, sandY + 12, width * 0.74, sandY + 2);
        ctx.bezierCurveTo(width * 0.88, sandY - 4, width * 0.96, sandY + 6, width, sandY + 8);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // --- 4. Layered Natural River Stones ---
        ctx.save();
        const stoneColor = theme.id === 'zen-garden' ? '#4A6B5D' : theme.id === 'love-lagoon' ? '#8C6F7E' : '#5A7888';
        ctx.fillStyle = stoneColor;

        ctx.beginPath();
        ctx.ellipse(width * 0.12, height - 16, 28, 14, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(width * 0.16, height - 14, 20, 11, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(width * 0.86, height - 18, 34, 16, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(width * 0.82, height - 14, 22, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // --- 5. Natural Swaying Vallisneria Aquatic Grasses ---
        simState.current.plantPhase += 0.025;
        const pPhase = simState.current.plantPhase;
        const plantPositions = [0.06, 0.14, 0.20, 0.80, 0.88, 0.94];

        ctx.save();
        plantPositions.forEach((pct, idx) => {
          const px = width * pct;
          const py = height - 12;
          const pHeight = 75 + (idx % 3) * 30;
          const sway = Math.sin(pPhase + idx * 0.7) * 14;

          ctx.strokeStyle =
            theme.id === 'zen-garden'
              ? '#2D7558'
              : theme.id === 'love-lagoon'
              ? '#B26284'
              : theme.id === 'midnight-ocean'
              ? '#3E6F80'
              : '#2E7876';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';

          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.quadraticCurveTo(px + sway * 0.4, py - pHeight * 0.5, px + sway, py - pHeight);
          ctx.stroke();

          ctx.fillStyle = ctx.strokeStyle;
          for (let l = 1; l <= 3; l++) {
            const ly = py - (pHeight / 4) * l;
            const lx = px + sway * (l / 4);
            ctx.beginPath();
            ctx.ellipse(lx + 4, ly, 5.5, 2.5, 0.35, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // --- 6. Controlled Ambient Water Bubbles (Micro-particles) ---
      simState.current.particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height + 8;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = 'rgba(243, 240, 232, 0.45)';
        ctx.fillStyle = 'rgba(243, 240, 232, 0.08)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Subtle specular highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // --- 7. Feeding Pellets Physics ---
      simState.current.pellets.forEach((pellet) => {
        if (!pellet.eaten) {
          pellet.y += pellet.vy;
          pellet.x += pellet.vx;

          if (pellet.y > height - sandHeight + 10) {
            pellet.eaten = true;
            consumePellet(pellet.id);
          }

          // Round golden-amber pellet styling
          ctx.save();
          const pGrad = ctx.createRadialGradient(
            pellet.x - pellet.size * 0.3,
            pellet.y - pellet.size * 0.3,
            pellet.size * 0.1,
            pellet.x,
            pellet.y,
            pellet.size
          );
          pGrad.addColorStop(0, '#FFF2C6');
          pGrad.addColorStop(0.45, '#E5A642');
          pGrad.addColorStop(1, '#8C4810');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(pellet.x, pellet.y, pellet.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          consumePellet(pellet.id);
        }
      });
      simState.current.pellets = simState.current.pellets.filter((p) => !p.eaten);

      // --- 8. Glass Tap Shockwave Ring ---
      simState.current.ripples.forEach((r) => {
        r.radius += 1.8;
        r.alpha -= 0.032;

        if (r.alpha > 0) {
          ctx.save();
          ctx.strokeStyle = `rgba(243, 240, 232, ${Math.max(0, r.alpha)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      });
      simState.current.ripples = simState.current.ripples.filter((r) => r.alpha > 0);

      if (simState.current.lastTap && Date.now() > simState.current.lastTap.timer) {
        simState.current.lastTap = null;
      }

      // --- 9. Fish Updates & Rendering (Candut & Repa with Evolved Sprites) ---
      const candut = simState.current.candut;
      const repa = simState.current.repa;

      const stage = level >= 401 ? 5 : level >= 301 ? 4 : level >= 201 ? 3 : level >= 101 ? 2 : 1;
      const candutSprite = fishSpritesRef.current[`candut_${stage}`];
      const repaSprite = fishSpritesRef.current[`repa_${stage}`];

      candut.update(width, height, repa, simState.current.pellets, simState.current.lastTap, level);
      repa.update(width, height, candut, simState.current.pellets, simState.current.lastTap, level);

      candut.draw(ctx, level, candutSprite, width);
      repa.draw(ctx, level, repaSprite, width);

      // --- 10. Subtle Foreground Vignette Sheen ---
      ctx.save();
      const sheen = ctx.createLinearGradient(0, 0, width, height * 0.35);
      sheen.addColorStop(0, 'rgba(243, 240, 232, 0.06)');
      sheen.addColorStop(1, 'rgba(243, 240, 232, 0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [aquarium.active_theme, aquarium.current_level, consumePellet, dayTimeMode]);

  const activePhase = getCurrentDayPhase(dayTimeMode);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden rounded-2xl border border-[#CBD7DF] cursor-pointer shadow-inner"
    >
      {/* Dynamic Day/Night Lighting Floating Selector */}
      <div className="absolute top-3.5 left-3.5 z-20">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDayMenuOpen(!isDayMenuOpen);
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/85 hover:bg-white text-[#182C3A] text-xs font-semibold backdrop-blur-xs border border-[#CBD7DF] shadow-xs transition active:scale-95"
            title="Pencahayaan Waktu Nyata Bawah Laut"
          >
            <span className="text-sm">{activePhase.icon}</span>
            <span className="text-[11px] font-medium text-[#4A6B82] hidden sm:inline">
              {activePhase.label}
            </span>
          </button>

          {isDayMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 mt-1.5 w-48 bg-white/95 backdrop-blur-md rounded-xl border border-[#CBD7DF] shadow-xl p-1.5 z-30 animate-fadeIn text-xs"
            >
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-[#526A7A] border-b border-[#E2EAF0] mb-1">
                Pencahayaan Samudra
              </div>
              {[
                { id: 'auto' as const, label: 'Otomatis (Jam Asli)', icon: '🕒' },
                { id: 'dawn' as const, label: 'Fajar (Subuh)', icon: '🌅' },
                { id: 'day' as const, label: 'Siang (Cerah)', icon: '☀️' },
                { id: 'sunset' as const, label: 'Senja (Keemasan)', icon: '🌇' },
                { id: 'night' as const, label: 'Malam (Bioluminesensi)', icon: '🌙' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setDayTimeMode(opt.id);
                    setIsDayMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg transition text-left text-xs ${
                    dayTimeMode === opt.id
                      ? 'bg-[#EBF2F7] text-[#4A6B82] font-semibold'
                      : 'text-[#182C3A] hover:bg-[#F4F7F9]'
                  }`}
                >
                  <span className="text-sm">{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleTap}
        onTouchStart={handleTap}
        className="w-full h-full block touch-none"
        title="Ketuk kaca akuarium untuk berinteraksi"
      />
    </div>
  );
}

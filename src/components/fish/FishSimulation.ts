// Fish Simulation Engine & Handcrafted Vector Aquarium Artwork
// Professional, organic kinematics, atmospheric lighting, and zero emoji aesthetics

export interface TapRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export interface AmbientParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  alpha: number;
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  eaten: boolean;
}

export class SimFish {
  name: string;
  role: 'candut' | 'repa';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetAngle: number;
  speed: number;
  maxSpeed: number;
  targetX: number;
  targetY: number;
  tailPhase: number;
  finPhase: number;
  mouthOpen: number; // 0 to 1
  sizeBase: number;
  eyeX: number;
  eyeY: number;

  constructor(role: 'candut' | 'repa', startX: number, startY: number) {
    this.role = role;
    this.name = role === 'candut' ? 'Candut' : 'Saridut';
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.targetAngle = 0;
    this.speed = 1.1;
    this.maxSpeed = 2.2;
    this.targetX = startX;
    this.targetY = startY;
    this.tailPhase = role === 'candut' ? 0.4 : 1.8;
    this.finPhase = role === 'candut' ? 0.1 : 1.2;
    this.mouthOpen = 0;
    this.sizeBase = 30;
    this.eyeX = 0;
    this.eyeY = 0;
  }

  update(
    width: number,
    height: number,
    partner: SimFish,
    pellets: FoodPellet[],
    targetTap: { x: number; y: number; active: boolean } | null,
    level: number
  ) {
    const milestoneScale = level >= 401 ? 1.20 : level >= 201 ? 1.12 : level >= 101 ? 1.05 : 0.95;
    const responsiveScale = width < 768 ? Math.max(0.58, Math.min(1.0, width / 680)) : 1.0;
    const currentSize = this.sizeBase * milestoneScale * responsiveScale;

    let targetFood: FoodPellet | null = null;
    if (pellets.length > 0) {
      let minDist = 999999;
      for (const p of pellets) {
        if (!p.eaten) {
          const d = Math.hypot(p.x - this.x, p.y - this.y);
          if (d < minDist) {
            minDist = d;
            targetFood = p;
          }
        }
      }
    }

    if (targetFood) {
      this.targetX = targetFood.x;
      this.targetY = targetFood.y;
      this.maxSpeed = 3.2 * responsiveScale;
      const dist = Math.hypot(targetFood.x - this.x, targetFood.y - this.y);
      if (dist < 36 * responsiveScale) {
        this.mouthOpen = Math.min(1, this.mouthOpen + 0.25);
      } else {
        this.mouthOpen = Math.max(0, this.mouthOpen - 0.1);
      }
      if (dist < 20 * responsiveScale && !targetFood.eaten) {
        targetFood.eaten = true;
      }
    } else if (targetTap && targetTap.active) {
      this.targetX = targetTap.x;
      this.targetY = targetTap.y;
      this.maxSpeed = 2.4 * responsiveScale;
      this.mouthOpen = Math.max(0, this.mouthOpen - 0.1);
    } else {
      this.maxSpeed = 1.4 * responsiveScale;
      this.mouthOpen = Math.max(0, this.mouthOpen - 0.05);

      // Periodically swim gently towards partner (intimate coupling)
      const partnerDist = Math.hypot(partner.x - this.x, partner.y - this.y);
      const maxPartnerDist = width < 640 ? 95 : 160;
      if (partnerDist > maxPartnerDist && (this.tailPhase % 12 < 0.1)) {
        this.targetX = partner.x + (this.role === 'candut' ? -28 : 28) * responsiveScale;
        this.targetY = partner.y + 10 * responsiveScale;
      } else if (Math.hypot(this.targetX - this.x, this.targetY - this.y) < 35 * responsiveScale) {
        const marginX = width * 0.14;
        const marginY = height * 0.16;
        this.targetX = marginX + Math.sin(this.tailPhase * 0.3) * (width * 0.36) + width * 0.36;
        this.targetY = marginY + Math.cos(this.tailPhase * 0.2) * (height * 0.26) + height * 0.26;
      }
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distToTarget = Math.hypot(dx, dy);

    this.targetAngle = Math.atan2(dy, dx);

    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.angle += angleDiff * 0.05;

    const desiredSpeed = Math.min(this.maxSpeed, Math.max(0.4, distToTarget * 0.015));
    this.speed += (desiredSpeed - this.speed) * 0.04;

    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.x += this.vx;
    this.y += this.vy;

    const boundPad = currentSize * 1.2;
    if (this.x < boundPad) this.x = boundPad;
    if (this.x > width - boundPad) this.x = width - boundPad;
    if (this.y < boundPad) this.y = boundPad;
    const bottomClearance = width < 640 ? 22 : 35;
    if (this.y > height - boundPad - bottomClearance) this.y = height - boundPad - bottomClearance;

    this.tailPhase += 0.15 * (this.speed / 1.1);
    this.finPhase += 0.11;

    const gazeAngle = Math.atan2(partner.y - this.y, partner.x - this.x);
    this.eyeX = Math.cos(gazeAngle) * 2.2 * responsiveScale;
    this.eyeY = Math.sin(gazeAngle) * 1.6 * responsiveScale;
  }

  draw(ctx: CanvasRenderingContext2D, level: number, spriteImg?: HTMLImageElement | null, canvasWidth?: number) {
    const isCandut = this.role === 'candut';
    const canvasW = canvasWidth || (ctx.canvas ? ctx.canvas.width / (window.devicePixelRatio || 1) : 800);
    const responsiveScale = canvasW < 768 ? Math.max(0.58, Math.min(1.0, canvasW / 680)) : 1.0;

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const isFacingLeft = Math.cos(this.angle) < 0;
      
      // Rotate in the direction of swimming with slight organic swimming oscillation
      const swimSway = Math.sin(this.tailPhase) * 0.08;
      ctx.rotate(this.angle + swimSway);

      // If swimming left, flip so fish remains upright while facing left
      if (isFacingLeft) {
        ctx.scale(1, -1);
      }

      // Vertical water breathing bobbing
      const bobY = Math.sin(this.finPhase) * 1.5;

      const stage = level >= 401 ? 5 : level >= 301 ? 4 : level >= 201 ? 3 : level >= 101 ? 2 : 1;
      const rawW = stage === 5 ? 78 : stage === 4 ? 70 : stage === 3 ? 62 : stage === 2 ? 55 : 46;
      const baseW = rawW * responsiveScale;
      const aspect = spriteImg.naturalWidth / spriteImg.naturalHeight;
      const baseH = baseW / aspect;

      // Level 401+ Subtle Amber Aura / Level 301+ Soft Bioluminescent Halo
      if (level >= 401) {
        ctx.save();
        const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, baseW * 0.7);
        aura.addColorStop(0, 'rgba(234, 167, 125, 0.28)');
        aura.addColorStop(1, 'rgba(234, 167, 125, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, baseW * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (level >= 301) {
        ctx.save();
        const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, baseW * 0.6);
        glow.addColorStop(0, isCandut ? 'rgba(74, 107, 130, 0.25)' : 'rgba(216, 115, 142, 0.28)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, baseW * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.drawImage(spriteImg, -baseW / 2, -baseH / 2 + bobY, baseW, baseH);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    const isFacingLeft = Math.cos(this.angle) < 0;
    ctx.rotate(this.angle);

    if (isFacingLeft) {
      ctx.scale(1, -1);
    }

    const scale = (level >= 401 ? 1.20 : level >= 201 ? 1.12 : level >= 101 ? 1.05 : 0.95) * responsiveScale;
    ctx.scale(scale, scale);

    const tailSwing = Math.sin(this.tailPhase) * 11;
    const finFlutter = Math.sin(this.finPhase) * 0.22;

    // Level 401+ Subtle Refined Amber Aura / Level 301+ Soft Bioluminescent Halo
    if (level >= 401) {
      ctx.save();
      const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 52);
      aura.addColorStop(0, 'rgba(215, 145, 105, 0.22)');
      aura.addColorStop(1, 'rgba(215, 145, 105, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (level >= 301) {
      ctx.save();
      const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 44);
      glow.addColorStop(0, isCandut ? 'rgba(93, 150, 149, 0.22)' : 'rgba(232, 168, 188, 0.24)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- 1. Caudal Fin (Tail) ---
    ctx.save();
    ctx.translate(-24, 0);
    ctx.rotate((tailSwing * Math.PI) / 180);

    const tailGrad = ctx.createLinearGradient(-16, 0, 0, 0);
    if (isCandut) {
      tailGrad.addColorStop(0, 'rgba(200, 215, 225, 0.75)');
      tailGrad.addColorStop(1, '#4A6B82');
    } else {
      tailGrad.addColorStop(0, 'rgba(252, 232, 238, 0.8)');
      tailGrad.addColorStop(1, '#D8738E');
    }

    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-12, -12, -22, -16, -24, -8);
    ctx.bezierCurveTo(-18, -2, -20, 2, -24, 8);
    ctx.bezierCurveTo(-22, 16, -12, 12, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- 2. Dorsal Fin (Top fin) ---
    ctx.save();
    ctx.fillStyle = isCandut ? '#4A6B82' : '#D8738E';
    ctx.beginPath();
    ctx.moveTo(-6, -13);
    ctx.quadraticCurveTo(4, -25 + Math.sin(this.finPhase) * 2.5, 12, -9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- 3. Body (Sophisticated silhouettes, warm pearl accents) ---
    ctx.save();
    const bodyGrad = ctx.createRadialGradient(-3, -3, 4, 0, 0, 30);
    if (isCandut) {
      // Candut: Pearl White to Nordic Sea Blue
      bodyGrad.addColorStop(0, '#FFFFFF');
      bodyGrad.addColorStop(0.45, '#C8D7E3');
      bodyGrad.addColorStop(1, '#4A6B82');
    } else {
      // Repa: Pure White to Rose Quartz
      bodyGrad.addColorStop(0, '#FFFFFF');
      bodyGrad.addColorStop(0.45, '#F9D0DC');
      bodyGrad.addColorStop(1, '#D8738E');
    }

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft warm pearl belly
    const bellyGrad = ctx.createRadialGradient(0, 7, 2, 0, 7, 14);
    bellyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    bellyGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.ellipse(-2, 5, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- 4. Pectoral Fin (Side fluttering fin) ---
    ctx.save();
    ctx.translate(2, 5);
    ctx.rotate(finFlutter);
    ctx.fillStyle = isCandut ? 'rgba(200, 215, 225, 0.85)' : 'rgba(252, 232, 238, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-3, 2, 8, 4.5, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- 5. Natural Subtle Cheek Warmth ---
    ctx.save();
    ctx.fillStyle = isCandut ? 'rgba(74, 107, 130, 0.35)' : 'rgba(216, 115, 142, 0.45)';
    ctx.beginPath();
    ctx.arc(13, 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- 6. Expressive, Handcrafted Eyes ---
    ctx.save();
    const eyeBaseX = 16;
    const eyeBaseY = -3.5;

    // Eye contour
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeBaseX, eyeBaseY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#23363D';
    ctx.stroke();

    // Iris & Pupil
    ctx.fillStyle = isCandut ? '#102A36' : '#2A1625';
    ctx.beginPath();
    ctx.arc(eyeBaseX + this.eyeX * 0.35, eyeBaseY + this.eyeY * 0.35, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Fine specular highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeBaseX + this.eyeX * 0.3 - 1, eyeBaseY - 1.2, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- 7. Mouth ---
    ctx.save();
    ctx.translate(26, 0);
    if (this.mouthOpen > 0.1) {
      ctx.fillStyle = isCandut ? '#1E5364' : '#6E4E5A';
      ctx.beginPath();
      ctx.arc(0, 0, 3 * this.mouthOpen, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#23363D';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(-2, -0.5, 3, 0.15, Math.PI * 0.65);
      ctx.stroke();
    }
    ctx.restore();

    // --- 8. Milestone Identity Marks (Level 201+) ---
    if (level >= 201) {
      ctx.save();
      if (isCandut) {
        // Sailor crest on Candut
        ctx.translate(8, -15);
        ctx.fillStyle = level >= 401 ? '#D79169' : '#1E5364';
        ctx.beginPath();
        ctx.roundRect(-6, -3, 12, 5, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -4, 4, Math.PI, 0);
        ctx.fill();
      } else {
        // Flora pin on Repa
        ctx.translate(8, -14);
        ctx.fillStyle = level >= 401 ? '#D79169' : '#E8A8BC';
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI * 2) / 4;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 3.5, Math.sin(a) * 3.5, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#F3F0E8';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}

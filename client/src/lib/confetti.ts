// High-Performance 60fps Canvas Micro-Particle Burst (0 dependencies)

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
  opacity: number;
}

const PALETTE = ['#2d5a3f', '#44835d', '#b8772a', '#bd5338', '#0284c7', '#10b981', '#f59e0b'];

export function triggerConfetti(originX?: number, originY?: number) {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const startX = originX ?? width * 0.7;
  const startY = originY ?? height * 0.45;

  const count = 38;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.5, // slight upward boost
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 14,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      size: 4 + Math.random() * 5,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      opacity: 1,
    });
  }

  const gravity = 0.28;
  const friction = 0.96;
  const startTime = performance.now();
  const maxDuration = 900; // ms

  function frame(currentTime: number) {
    if (!ctx) return;
    const elapsed = currentTime - startTime;

    if (elapsed > maxDuration) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.vx *= friction;
      p.vy = p.vy * friction + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
      p.opacity = Math.max(0, 1 - elapsed / maxDuration);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

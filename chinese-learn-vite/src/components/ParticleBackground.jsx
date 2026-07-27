import React, { useRef, useEffect, useCallback } from 'react';

const PARTICLE_COUNT = 65;

function getThemeColors(isDark) {
  return isDark
    ? [
        { r: 56, g: 189, b: 248 },    // sky-400
        { r: 129, g: 140, b: 248 },   // indigo-400
        { r: 34, g: 211, b: 238 },    // cyan-400
        { r: 167, g: 139, b: 250 },   // violet-400
        { r: 14, g: 165, b: 233 },    // sky-500
      ]
    : [
        { r: 249, g: 115, b: 22 },    // orange-500
        { r: 244, g: 63, b: 94 },     // rose-500
        { r: 251, g: 146, b: 60 },    // orange-400
        { r: 236, g: 72, b: 153 },    // pink-500
        { r: 245, g: 158, b: 11 },    // amber-500
      ];
}

class Particle {
  constructor(w, h, isDark) {
    this.init(w, h, isDark);
  }

  init(w, h, isDark) {
    const colors = getThemeColors(isDark);
    const color = colors[Math.floor(Math.random() * colors.length)];
    this.targetColor = { ...color };
    this.currentColor = { ...color };
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = 1.5 + Math.random() * 3.5;
    this.speedY = -(0.15 + Math.random() * 0.35);
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.drift = (Math.random() - 0.5) * 0.3;
    this.opacity = 0.2 + Math.random() * 0.5;
    this.pulseSpeed = 0.005 + Math.random() * 0.015;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.time = 0;
    this.alive = true;
  }

  updateTargetColor(isDark) {
    const colors = getThemeColors(isDark);
    const color = colors[Math.floor(Math.random() * colors.length)];
    this.targetColor = { ...color };
  }

  update(w, h, isDark, delta) {
    this.time += delta;
    this.y += this.speedY * delta;
    this.x += this.speedX * delta + Math.sin(this.time * 0.5 + this.drift) * 0.15;

    // Gentle pulse
    this.currentOpacity = this.opacity * (0.6 + 0.4 * Math.sin(this.time * this.pulseSpeed + this.pulsePhase));

    // Smooth color transition when theme changes
    const colors = getThemeColors(isDark);
    // Occasionally pick a new target color for variation
    if (Math.random() < 0.001) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.targetColor = { ...color };
    }

    // Lerp current color toward target
    this.currentColor.r += (this.targetColor.r - this.currentColor.r) * 0.02;
    this.currentColor.g += (this.targetColor.g - this.currentColor.g) * 0.02;
    this.currentColor.b += (this.targetColor.b - this.currentColor.b) * 0.02;

    // Wrap around screen
    if (this.y < -10) {
      this.y = h + 10;
      this.x = Math.random() * w;
    }
    if (this.x < -10) this.x = w + 10;
    if (this.x > w + 10) this.x = -10;
  }

  draw(ctx) {
    const { r, g, b } = this.currentColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.currentOpacity})`;
    ctx.fill();

    // Subtle glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.currentOpacity * 0.08})`;
    ctx.fill();
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const themeRef = useRef(false);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  const initParticles = useCallback((w, h, isDark) => {
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle(w, h, isDark));
    }
    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // Detect theme
    const isDark = document.documentElement.classList.contains('dark');
    themeRef.current = isDark;

    // Init particles
    particlesRef.current = initParticles(w, h, isDark);

    // Animation loop
    let prevIsDark = isDark;
    const animate = (timestamp) => {
      const delta = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 16, 3) : 1;
      lastTimeRef.current = timestamp;

      const currentIsDark = document.documentElement.classList.contains('dark');

      // Detect theme change — immediately update all particle colors
      if (currentIsDark !== prevIsDark) {
        prevIsDark = currentIsDark;
        particlesRef.current.forEach(p => p.updateTargetColor(currentIsDark));
      }

      ctx.clearRect(0, 0, w, h);

      particlesRef.current.forEach(p => {
        p.update(w, h, currentIsDark, delta);
        p.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Handle resize
    const handleResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  );
}

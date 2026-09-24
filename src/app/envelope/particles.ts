export interface Point {
  x: number;
  y: number;
}

type Kind = 'mote' | 'petal' | 'spark' | 'crumb';

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  /** flip phase for petals: cos(flip) is the visible width, sign is which side faces us */
  flip: number;
  vflip: number;
  size: number;
  age: number;
  life: number;
  color: [number, number, number];
  seed: number;
  fade: number;
}

const PETAL_COLORS: [number, number, number][] = [
  [231, 207, 200],
  [201, 154, 148],
  [181, 100, 109],
  [216, 191, 138],
  [243, 231, 223],
  [217, 179, 171],
];
const GOLD: [number, number, number] = [216, 191, 138];
const WAX: [number, number, number] = [110, 28, 41];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * A tiny particle system on one full-screen canvas.
 * Everything is in CSS pixels; the canvas is scaled for the device pixel ratio.
 */
export class ParticleField {
  private readonly ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private ambient = false;
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;
  private readonly onResize = () => this.resize();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onFrame?: (dt: number) => void,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  /** true while petals, sparks or crumbs are still on screen */
  get busy(): boolean {
    return this.particles.some((p) => p.kind !== 'mote');
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.particles = [];
  }

  /** Slow gold dust drifting in the light. */
  startAmbient(count: number): void {
    this.ambient = true;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.mote(rand(0, this.w), rand(0, this.h), rand(0, 4000)));
    }
  }

  stopAmbient(): void {
    this.ambient = false;
    for (const p of this.particles) if (p.kind === 'mote') p.life = p.age + 700;
  }

  sparks(at: Point, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.2, 5.5);
      this.particles.push({
        kind: 'spark',
        x: at.x,
        y: at.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        rot: rand(0, Math.PI),
        vr: rand(-0.1, 0.1),
        flip: 0,
        vflip: 0,
        size: rand(2.5, 6),
        age: 0,
        life: rand(600, 1300),
        color: GOLD,
        seed: rand(0, 100),
        fade: 0,
      });
    }
  }

  crumbs(at: Point, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      const speed = rand(1, 3.6);
      this.particles.push({
        kind: 'crumb',
        x: at.x + rand(-12, 12),
        y: at.y + rand(-8, 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.25, 0.25),
        flip: 0,
        vflip: 0,
        size: rand(1.6, 3.6),
        age: 0,
        life: rand(1100, 1700),
        color: WAX,
        seed: rand(0, 100),
        fade: 0,
      });
    }
  }

  /** Petals thrown up out of the envelope mouth, then fluttering down. */
  petals(from: Point, width: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        kind: 'petal',
        x: from.x + rand(-width / 2, width / 2),
        y: from.y + rand(-6, 10),
        vx: rand(-2.6, 2.6),
        vy: rand(-9.5, -4.5),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.06, 0.06),
        flip: rand(0, Math.PI * 2),
        vflip: rand(0.04, 0.11),
        size: rand(6, 11.5),
        age: -rand(0, 650),
        life: Infinity,
        color: pick(PETAL_COLORS),
        seed: rand(0, 100),
        fade: 0,
      });
    }
  }

  private mote(x: number, y: number, age = 0): Particle {
    return {
      kind: 'mote',
      x,
      y,
      vx: rand(0.03, 0.14),
      vy: rand(-0.14, -0.03),
      rot: 0,
      vr: 0,
      flip: 0,
      vflip: 0,
      size: rand(0.8, 2.3),
      age,
      life: Infinity,
      color: GOLD,
      seed: rand(0, 100),
      fade: 0,
    };
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private loop(now: number): void {
    const dt = Math.min(48, this.last ? now - this.last : 16.7);
    this.last = now;
    this.onFrame?.(dt);
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }

  private update(dt: number): void {
    const f = dt / 16.7;
    const keep: Particle[] = [];

    for (const p of this.particles) {
      p.age += dt;
      if (p.age < 0) {
        keep.push(p);
        continue;
      }

      switch (p.kind) {
        case 'mote':
          p.x += (p.vx + Math.sin(p.age * 0.0009 + p.seed) * 0.08) * f;
          p.y += (p.vy + Math.cos(p.age * 0.0011 + p.seed) * 0.05) * f;
          if (this.ambient) {
            if (p.x > this.w + 10) p.x = -10;
            if (p.y < -10) p.y = this.h + 10;
          }
          break;
        case 'petal':
          p.vy = Math.min(p.vy + 0.16 * f, 1.9 + Math.sin(p.seed) * 0.4);
          p.vx = p.vx * Math.pow(0.975, f) + Math.sin(p.age * 0.0026 + p.seed) * 0.045 * f;
          p.x += p.vx * f;
          p.y += p.vy * f;
          p.rot += p.vr * f;
          p.flip += p.vflip * f;
          if (p.y > this.h + 30) p.life = 0;
          break;
        case 'spark':
          p.vx *= Math.pow(0.92, f);
          p.vy = p.vy * Math.pow(0.92, f) + 0.03 * f;
          p.x += p.vx * f;
          p.y += p.vy * f;
          p.rot += p.vr * f;
          break;
        case 'crumb':
          p.vy += 0.22 * f;
          p.vx *= Math.pow(0.99, f);
          p.x += p.vx * f;
          p.y += p.vy * f;
          p.rot += p.vr * f;
          break;
      }

      p.fade = Math.min(1, p.fade + dt / 220);
      if (p.age < p.life && p.y < this.h + 40) keep.push(p);
    }
    this.particles = keep;
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    for (const p of this.particles) {
      if (p.age < 0) continue;
      const out = Number.isFinite(p.life) ? Math.min(1, (p.life - p.age) / 350) : 1;
      const alpha = p.fade * Math.max(0, out);
      const [r, g, b] = p.color;

      switch (p.kind) {
        case 'mote': {
          const twinkle = 0.45 + 0.4 * Math.sin(p.age * 0.0017 + p.seed);
          const a = alpha * twinkle;
          const radius = p.size * 3.4;
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          glow.addColorStop(0, `rgba(${r - 15},${g - 20},${b - 30},${a * 0.85})`);
          glow.addColorStop(0.28, `rgba(${r},${g},${b},${a * 0.35})`);
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'petal': {
          const width = Math.cos(p.flip);
          const back = width < 0 ? 0.82 : 1;
          const s = p.size;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(Math.max(0.12, Math.abs(width)), 1);
          ctx.fillStyle = `rgba(${Math.round(r * back)},${Math.round(g * back)},${Math.round(b * back)},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.bezierCurveTo(s * 0.95, -s * 0.55, s * 0.7, s * 0.8, 0, s);
          ctx.bezierCurveTo(-s * 0.7, s * 0.8, -s * 0.95, -s * 0.55, 0, -s);
          ctx.fill();
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.28})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, -s * 0.7);
          ctx.quadraticCurveTo(s * 0.12, 0, 0, s * 0.75);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'spark': {
          const tw = 0.55 + 0.45 * Math.abs(Math.sin(p.age * 0.018 + p.seed));
          const s = p.size * tw;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
            ctx.lineTo(Math.cos(a + Math.PI / 4) * s * 0.28, Math.sin(a + Math.PI / 4) * s * 0.28);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = `rgba(255,250,235,${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case 'crumb': {
          const s = p.size;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(-s, -s * 0.6);
          ctx.lineTo(s * 0.9, -s * 0.2);
          ctx.lineTo(s * 0.2, s);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = `rgba(190,90,105,${alpha * 0.7})`;
          ctx.beginPath();
          ctx.moveTo(-s, -s * 0.6);
          ctx.lineTo(s * 0.9, -s * 0.2);
          ctx.lineTo(0, -s * 0.25);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
      }
    }
  }
}

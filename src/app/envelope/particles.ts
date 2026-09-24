export interface Point {
  x: number;
  y: number;
}

type Kind = 'mote' | 'petal' | 'chip';

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** height above the table (we look straight down at it), and its speed */
  z: number;
  vz: number;
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

/** dried rose petals: dusty pinks, a deep burgundy, ivory and a faded ochre */
const PETAL_COLORS: [number, number, number][] = [
  [196, 128, 126],
  [168, 88, 98],
  [222, 188, 174],
  [234, 218, 200],
  [198, 162, 112],
  [138, 66, 80],
];
const GOLD: [number, number, number] = [216, 191, 138];
const WAX: [number, number, number] = [110, 28, 41];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** The soft glow of a mote, drawn once; building a gradient per mote per frame is slow on phones. */
function moteSprite(): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const [r, g, b] = GOLD;
  const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  glow.addColorStop(0, `rgba(${r - 15},${g - 20},${b - 30},0.85)`);
  glow.addColorStop(0.28, `rgba(${r},${g},${b},0.35)`);
  glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  return c;
}
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/**
 * A tiny particle system on one full-screen canvas.
 * Everything is in CSS pixels; the canvas is scaled for the device pixel ratio.
 */
export class ParticleField {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly moteGlow = moteSprite();
  private particles: Particle[] = [];
  private ambient = false;
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;
  private readonly onResize = () => this.resize();
  private wasStill = false;

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

  /** true while wax chips or petals are still in the air */
  get busy(): boolean {
    return this.particles.some((p) => p.kind !== 'mote' && this.moving(p));
  }

  private moving(p: Particle): boolean {
    return p.z > 0 || p.vz !== 0 || p.vx !== 0 || p.vy !== 0;
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

  /** Chips of wax popping off along the fracture; they hop, land and skid to a stop on the paper. */
  chips(along: Point[], count: number): void {
    for (let i = 0; i < count; i++) {
      const at = pick(along);
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.5, 2.6);
      this.particles.push({
        ...this.blank('chip', at.x + rand(-2, 2), at.y + rand(-2, 2)),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        z: 2,
        vz: rand(1.2, 3.4),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.3, 0.3),
        size: rand(1.3, 3.2),
        color: WAX,
      });
    }
  }

  /**
   * Dried petals tucked in with the card: they tumble out of the envelope's mouth
   * as the card is drawn, flutter down and settle on the table around it.
   */
  spill(from: Point, width: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        ...this.blank('petal', from.x + rand(-width / 2, width / 2), from.y + rand(-4, 8)),
        vx: rand(-2.6, 2.6),
        vy: rand(-2.8, 0.4),
        z: rand(8, 16),
        vz: rand(0.2, 1.4),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.07, 0.07),
        flip: rand(0, Math.PI * 2),
        vflip: rand(0.05, 0.12),
        size: rand(5, 9),
        age: -rand(0, 700),
        color: pick(PETAL_COLORS),
      });
    }
  }

  private blank(kind: Kind, x: number, y: number): Particle {
    return {
      kind,
      x,
      y,
      vx: 0,
      vy: 0,
      z: 0,
      vz: 0,
      rot: 0,
      vr: 0,
      flip: 0,
      vflip: 0,
      size: 1,
      age: 0,
      life: Infinity,
      color: GOLD,
      seed: rand(0, 100),
      fade: 0,
    };
  }

  private mote(x: number, y: number, age = 0): Particle {
    return {
      ...this.blank('mote', x, y),
      vx: rand(0.03, 0.14),
      vy: rand(-0.14, -0.03),
      size: rand(0.8, 2.3),
      age,
    };
  }

  private resize(): void {
    // soft, moving specks don't need full retina resolution, and the whole canvas is re-uploaded every frame
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.wasStill = false; // resizing cleared the canvas
  }

  private loop(now: number): void {
    const dt = Math.min(48, this.last ? now - this.last : 16.7);
    this.last = now;
    this.onFrame?.(dt);
    this.update(dt);
    // once everything has landed the picture no longer changes: skip redrawing (and re-uploading) the canvas
    const still = !this.particles.some((p) => p.kind === 'mote' || p.age < 0 || p.fade < 1 || this.moving(p));
    if (!still || !this.wasStill) this.draw();
    this.wasStill = still;
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
          if (p.z > 0) {
            // air drag and a lazy flutter while it sinks
            p.vz = Math.max(p.vz - 0.09 * f, -0.45 - Math.sin(p.flip) * 0.15);
            p.vx = p.vx * Math.pow(0.985, f) + Math.sin(p.age * 0.003 + p.seed) * 0.03 * f;
            p.vy *= Math.pow(0.985, f);
            p.flip += p.vflip * f;
            p.rot += p.vr * f;
          }
          this.move(p, f, 0.8);
          break;
        case 'chip':
          if (p.z > 0) {
            p.vz -= 0.28 * f;
            p.rot += p.vr * f;
          }
          this.move(p, f, 0.72);
          break;
      }

      p.fade = Math.min(1, p.fade + dt / 220);
      if (p.age < p.life && p.y < this.h + 40) keep.push(p);
    }
    this.particles = keep;
  }

  /** Move through the air; on the table, bounce a little and slide to a stop. */
  private move(p: Particle, f: number, friction: number): void {
    p.x += p.vx * f;
    p.y += p.vy * f;
    p.z += p.vz * f;
    if (p.z <= 0) {
      p.z = 0;
      p.vz = p.vz < -1 ? -p.vz * 0.3 : 0;
      p.vx *= Math.pow(friction, f);
      p.vy *= Math.pow(friction, f);
      p.vr *= Math.pow(friction, f);
      if (Math.hypot(p.vx, p.vy) < 0.05) p.vx = p.vy = 0;
    }
  }

  /** Its shadow on the table: further off and fainter the higher it is. Light comes from the top left. */
  private shadow(p: Particle, alpha: number, shape: () => void): void {
    if (p.z <= 0.3) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x + 0.6 + p.z * 0.35, p.y + 1 + p.z * 0.55);
    ctx.rotate(p.rot);
    ctx.fillStyle = `rgba(18,30,24,${alpha * Math.max(0.08, 0.3 - p.z * 0.012)})`;
    shape();
    ctx.restore();
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
          const radius = p.size * 3.4;
          ctx.globalAlpha = Math.max(0, alpha * twinkle);
          ctx.drawImage(this.moteGlow, p.x - radius, p.y - radius, radius * 2, radius * 2);
          ctx.globalAlpha = 1;
          break;
        }

        case 'petal': {
          const width = Math.max(0.14, Math.abs(Math.cos(p.flip)));
          const back = Math.cos(p.flip) < 0 ? 0.82 : 1;
          const s = p.size * (1 + p.z / 70);
          const petal = () => {
            ctx.scale(width, 1);
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.bezierCurveTo(s * 0.95, -s * 0.55, s * 0.7, s * 0.8, 0, s);
            ctx.bezierCurveTo(-s * 0.7, s * 0.8, -s * 0.95, -s * 0.55, 0, -s);
            ctx.fill();
          };
          this.shadow(p, alpha, petal);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(${Math.round(r * back)},${Math.round(g * back)},${Math.round(b * back)},${alpha})`;
          petal();
          // the darker, crinkled base of a dried petal and its central vein
          ctx.fillStyle = `rgba(90,40,40,${alpha * 0.16})`;
          ctx.beginPath();
          ctx.ellipse(0, s * 0.62, s * 0.34, s * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(255,245,235,${alpha * 0.3})`;
          ctx.lineWidth = 0.7 / width;
          ctx.beginPath();
          ctx.moveTo(0, -s * 0.7);
          ctx.quadraticCurveTo(s * 0.12, 0, 0, s * 0.75);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 'chip': {
          const s = p.size * (1 + p.z / 40);
          const chip = () => {
            ctx.beginPath();
            ctx.moveTo(-s, -s * 0.6);
            ctx.lineTo(s * 0.9, -s * 0.3);
            ctx.lineTo(s * 0.5, s * 0.8);
            ctx.lineTo(-s * 0.4, s * 0.9);
            ctx.closePath();
            ctx.fill();
          };
          this.shadow(p, alpha, chip);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          chip();
          // the polished face catches the light
          ctx.fillStyle = `rgba(214,120,130,${alpha * 0.55})`;
          ctx.beginPath();
          ctx.moveTo(-s, -s * 0.6);
          ctx.lineTo(s * 0.9, -s * 0.3);
          ctx.lineTo(0, -s * 0.1);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
      }
    }
  }
}

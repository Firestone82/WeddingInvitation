import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Seal } from '../shared/seal/seal';
import { prefersReducedMotion } from '../core/browser';
import { ParticleField } from './particles';
import { BRANCH_A, BRANCH_B } from './leaves';

/**
 * loading   waiting for fonts so the handwriting never flashes
 * arriving  envelope drops in, seal is stamped, address is written
 * sealed    idle, waiting for the tap
 * opening   seal cracks, flap opens, letter slides out
 * lifting   card leaves the envelope and grows to fill the screen
 * leaving   card dissolves into the page, petals keep falling
 */
type Phase = 'loading' | 'arriving' | 'sealed' | 'opening' | 'lifting' | 'leaving';

/** Timeline in ms. Keep in sync with envelope.css. */
const ARRIVE_MS = 1900;
const OPEN = { crack: 280, petals: 1350, lift: 2500, leave: 3250 } as const;

@Component({
  selector: 'app-envelope',
  imports: [Seal],
  templateUrl: './envelope.html',
  styleUrl: './envelope.css',
  host: {
    class: 'intro',
    '[class.is-arriving]': 'phase() !== "loading"',
    '[class.is-ready]': 'phase() === "sealed"',
    '[class.is-opening]': 'opened()',
    '[class.is-lifting]': 'phase() === "lifting" || phase() === "leaving"',
    '[class.is-expanding]': 'expanding()',
    '[class.is-leaving]': 'phase() === "leaving"',
    '[class.is-pressed]': 'pressed()',
    '[class.has-gyro]': 'gyro()',
    '(pointermove)': 'onPointer($event)',
    '(pointerleave)': 'resetTilt()',
  },
})
export class Envelope {
  readonly recipient = input.required<string>();
  readonly initials = input.required<[string, string]>();
  readonly names = input.required<[string, string]>();
  readonly dateLine = input.required<string>();
  readonly hintTouch = input.required<string>();
  readonly hintMouse = input.required<string>();
  readonly openLabel = input.required<string>();
  /** id of the page heading the names on the card fly to */
  readonly namesTarget = input('couple-names');

  /** Fires synchronously on click, still inside the user gesture (safe to start audio). */
  readonly opening = output<void>();
  /** The page behind may start its entrance. */
  readonly revealed = output<void>();
  /** The intro can be removed from the DOM. */
  readonly finished = output<void>();

  protected readonly phase = signal<Phase>('loading');
  protected readonly expanding = signal(false);
  protected readonly pressed = signal(false);
  protected readonly gyro = signal(false);
  protected readonly opened = computed(() => ['opening', 'lifting', 'leaving'].includes(this.phase()));
  protected readonly branchA = BRANCH_A;
  protected readonly branchB = BRANCH_B;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('fx');
  private readonly envelopeEl = viewChild.required<ElementRef<HTMLElement>>('envelope');
  private readonly tiltEl = viewChild.required<ElementRef<HTMLElement>>('tilt');
  private readonly letterEl = viewChild.required<ElementRef<HTMLElement>>('letter');
  private readonly letterInnerEl = viewChild.required<ElementRef<HTMLElement>>('letterInner');
  private readonly sheetEl = viewChild.required<ElementRef<HTMLElement>>('sheet');
  private readonly sheetNamesEl = viewChild.required<ElementRef<HTMLElement>>('sheetNames');
  private readonly sealEl = viewChild.required<ElementRef<HTMLElement>>('seal');

  private readonly reduced = prefersReducedMotion();
  private field?: ParticleField;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private pendingOpen = false;
  private leaveAt = 0;
  private done = false;

  // tilt state, eased every frame towards the target
  private tilt = { rx: 0, ry: 0, lx: 30, ly: 20 };
  private target = { rx: 0, ry: 0, lx: 30, ly: 20 };
  private readonly written = new Map<string, string>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach(clearTimeout);
      this.field?.destroy();
      window.removeEventListener('deviceorientation', this.onOrientation);
    });

    afterNextRender(() => {
      if (this.reduced) {
        this.phase.set('sealed');
        return;
      }
      this.field = new ParticleField(this.canvas().nativeElement, (dt) => this.frame(dt));
      this.field.startAmbient(window.innerWidth < 640 ? 18 : 30);
      this.listenToGyro();

      const fonts = Promise.all([
        document.fonts.load('1em "Parisienne"'),
        document.fonts.load('italic 1em "Bodoni Moda Variable"'),
      ]);
      const timeout = new Promise((resolve) => setTimeout(resolve, 1500));
      Promise.race([fonts, timeout]).finally(() => this.arrive());
    });
  }

  // ---------- idle ----------

  private arrive(): void {
    this.phase.set('arriving');
    this.later(ARRIVE_MS, () => {
      if (this.phase() !== 'arriving') return;
      this.phase.set('sealed');
      if (this.pendingOpen) this.open();
    });
  }

  protected onPointer(e: PointerEvent): void {
    if (e.pointerType !== 'mouse' || this.opened()) return;
    const r = this.envelopeEl().nativeElement.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
    this.target = { rx: -ny * 9, ry: nx * 12, lx: 50 + nx * 45, ly: 40 + ny * 45 };
  }

  protected resetTilt(): void {
    this.target = { rx: 0, ry: 0, lx: 30, ly: 20 };
  }

  private readonly onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null || this.opened()) return;
    if (!this.gyro()) this.gyro.set(true);
    const ny = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    const nx = Math.max(-1, Math.min(1, e.gamma / 30));
    this.target = { rx: -ny * 7, ry: nx * 9, lx: 50 + nx * 40, ly: 40 + ny * 40 };
  };

  /** Android gives orientation without asking; iOS needs a permission prompt, so it keeps the CSS sway. */
  private listenToGyro(): void {
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: unknown } })
      .DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission !== 'function' && matchMedia('(hover: none)').matches) {
      window.addEventListener('deviceorientation', this.onOrientation, { passive: true });
    }
  }

  private frame(dt: number): void {
    const k = 1 - Math.pow(0.9, dt / 16.7);
    const t = this.tilt;
    const g = this.opened() ? { rx: 0, ry: 0, lx: t.lx, ly: t.ly } : this.target;
    t.rx += (g.rx - t.rx) * k;
    t.ry += (g.ry - t.ry) * k;
    t.lx += (g.lx - t.lx) * k;
    t.ly += (g.ly - t.ly) * k;
    this.applyTilt();

    // Remove the intro once the card is gone and the last petal has landed.
    if (this.phase() === 'leaving' && !this.done && performance.now() - this.leaveAt > 900 && !this.field?.busy) {
      this.finish();
    }
  }

  private applyTilt(): void {
    const t = this.tilt;
    const tilt = this.tiltEl().nativeElement.style;
    this.setVar(tilt, '--rx', `${t.rx.toFixed(2)}deg`);
    this.setVar(tilt, '--ry', `${t.ry.toFixed(2)}deg`);
    this.setVar(tilt, '--lx', `${t.lx.toFixed(1)}%`);
    this.setVar(tilt, '--ly', `${t.ly.toFixed(1)}%`);
    this.setVar(this.host.style, '--px', `${(-t.ry * 1.4).toFixed(1)}px`);
    this.setVar(this.host.style, '--py', `${(t.rx * 1.4).toFixed(1)}px`);
  }

  /** These inherit into the whole scene, so only touch them when the value really changes. */
  private setVar(style: CSSStyleDeclaration, name: string, value: string): void {
    const key = style === this.host.style ? `host${name}` : name;
    if (this.written.get(key) === value) return;
    this.written.set(key, value);
    style.setProperty(name, value);
  }

  /**
   * Phones without a gyro tilt via a CSS sway, which stops once opening starts.
   * Start the eased tilt from wherever the sway is, so the envelope settles flat
   * instead of freezing askew (or snapping) while it opens.
   */
  private takeOverSway(): void {
    // the sway is rotateX(a) rotateY(b); read both angles back out of the matrix
    const m = new DOMMatrixReadOnly(getComputedStyle(this.tiltEl().nativeElement).transform);
    const deg = 180 / Math.PI;
    this.tilt.rx = Math.atan2(m.m23, m.m22) * deg;
    this.tilt.ry = Math.asin(Math.max(-1, Math.min(1, m.m31))) * deg;
    this.applyTilt();
  }

  // ---------- opening ----------

  protected press(down: boolean): void {
    this.pressed.set(down && (this.phase() === 'sealed' || this.phase() === 'arriving'));
  }

  protected open(): void {
    const phase = this.phase();
    if (phase === 'loading' || phase === 'arriving') {
      this.pendingOpen = true;
      return;
    }
    if (phase !== 'sealed') return;

    this.pressed.set(false);
    this.opening.emit();

    if (this.reduced) {
      this.phase.set('leaving');
      this.revealed.emit();
      this.later(450, () => this.finish());
      return;
    }

    this.takeOverSway();
    this.phase.set('opening');
    this.field?.stopAmbient();
    navigator.vibrate?.(12);

    this.later(OPEN.crack, () => {
      const s = this.sealEl().nativeElement.getBoundingClientRect();
      const at = { x: s.left + s.width / 2, y: s.top + s.height / 2 };
      this.field?.crumbs(at, 16);
      this.field?.sparks(at, 26);
      navigator.vibrate?.([8, 40, 18]);
    });

    this.later(OPEN.petals, () => {
      const e = this.envelopeEl().nativeElement.getBoundingClientRect();
      const count = window.innerWidth < 640 ? 46 : 70;
      this.field?.petals({ x: e.left + e.width / 2, y: e.top + e.height * 0.12 }, e.width * 0.7, count);
    });

    this.later(OPEN.lift, () => this.lift());

    this.later(OPEN.leave, () => {
      this.phase.set('leaving');
      this.leaveAt = performance.now();
      this.revealed.emit();
    });

    // Safety net in case the frame loop is throttled (background tab).
    this.later(OPEN.leave + 9000, () => this.finish());
  }

  /** Place the full-screen sheet exactly over the card, then let it grow. */
  private lift(): void {
    const card = this.letterEl().nativeElement.getBoundingClientRect();
    const inner = this.letterInnerEl().nativeElement.getBoundingClientRect();
    const env = this.envelopeEl().nativeElement.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = this.sheetEl().nativeElement.style;

    s.setProperty('--ct', `${card.top}px`);
    s.setProperty('--cr', `${vw - card.right}px`);
    s.setProperty('--cb', `${vh - card.bottom}px`);
    s.setProperty('--cl', `${card.left}px`);
    s.setProperty('--ft', `${inner.top}px`);
    s.setProperty('--fl', `${inner.left}px`);
    s.setProperty('--fw', `${inner.width}px`);
    s.setProperty('--fh', `${inner.height}px`);
    s.setProperty('--cq', `${env.width / 100}px`);

    this.phase.set('lifting');

    // Aim the names at the heading on the page, so they appear to land there.
    requestAnimationFrame(() => {
      const from = this.sheetNamesEl().nativeElement.getBoundingClientRect();
      const to = document.getElementById(this.namesTarget())?.getBoundingClientRect();
      if (!to || !from.width) return;
      const scale = Math.min(2.6, Math.max(1, (to.width * 0.8) / from.width));
      s.setProperty('--mx', `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
      s.setProperty('--my', `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
      s.setProperty('--ms', scale.toFixed(3));
    });
    // two frames: let the sheet paint at the card's size before it grows
    requestAnimationFrame(() => requestAnimationFrame(() => this.expanding.set(true)));
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.field?.destroy();
    this.finished.emit();
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}

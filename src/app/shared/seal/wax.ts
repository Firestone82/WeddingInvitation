/**
 * Paints a wax seal into a bitmap, lit like the real thing.
 *
 * The artwork is drawn as two height maps: the broad relief (the puddle of wax,
 * the face the stamp pressed in, the lip it pushed up) and the fine engraving
 * (monogram, laurel). Their slopes give surface normals, which are lit by the
 * window light from the top left: a matte diffuse term and a glossy highlight.
 * Done once per monogram and reused everywhere, so it costs nothing while the
 * seal is animating, and looks the same in every browser.
 */

const f = (n: number) => n.toFixed(2);

function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Closed smooth path through the points (Catmull-Rom as cubic Béziers). */
function smooth(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

/** The puddle of wax: roughly round, with a few places where it ran further. */
function waxOutline(seed: number, radius: number): string {
  const rand = seeded(seed);
  const phase = [rand(), rand(), rand(), rand()].map((r) => r * Math.PI * 2);
  const runs: [number, number][] = [
    [0.4 + rand(), 0.07],
    [2.4 + rand(), 0.055],
    [4.3 + rand(), 0.08],
    [5.6, 0.035],
  ];
  const pts: [number, number][] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    let k =
      1 +
      0.022 * Math.sin(3 * a + phase[0]) +
      0.018 * Math.sin(5 * a + phase[1]) +
      0.012 * Math.sin(8 * a + phase[2]) +
      0.006 * Math.sin(13 * a + phase[3]);
    for (const [at, amount] of runs) {
      const d = Math.atan2(Math.sin(a - at), Math.cos(a - at));
      k += amount * Math.exp(-(d * d) / 0.035);
    }
    pts.push([50 + Math.cos(a) * radius * k, 50 + Math.sin(a) * radius * k]);
  }
  return smooth(pts);
}

function leaf(x: number, y: number, angle: number, len: number): string {
  const [c, s, w] = [Math.cos(angle), Math.sin(angle), len * 0.42];
  const tip = [x + c * len, y + s * len];
  const a = [x + c * len * 0.45 - s * w, y + s * len * 0.45 + c * w];
  const b = [x + c * len * 0.45 + s * w, y + s * len * 0.45 - c * w];
  return `M${f(x)} ${f(y)}Q${f(a[0])} ${f(a[1])} ${f(tip[0])} ${f(tip[1])}Q${f(b[0])} ${f(b[1])} ${f(x)} ${f(y)}Z`;
}

/** Two laurel branches rising from the bottom of the stamp's face. */
function laurel(radius: number): { stems: string; leaves: string } {
  let stems = '';
  let leaves = '';
  for (const side of [-1, 1]) {
    const a0 = Math.PI / 2 + side * 0.18;
    const a1 = Math.PI / 2 + side * 1.95;
    const at = (a: number) => [50 + Math.cos(a) * radius, 50 + Math.sin(a) * radius];
    for (let i = 0; i <= 40; i++) {
      const [x, y] = at(a0 + (a1 - a0) * (i / 40));
      stems += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
    }
    const count = 9;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.6) / count;
      const a = a0 + (a1 - a0) * t;
      const [x, y] = at(a);
      const growth = a + (side * Math.PI) / 2;
      const len = 5.4 - t * 2.2;
      leaves += leaf(x, y, growth - 0.55 * side, len) + leaf(x, y, growth + 0.55 * side, len * 0.9);
    }
    const [x, y] = at(a1);
    leaves += leaf(x, y, a1 + (side * Math.PI) / 2, 4.2);
  }
  return { stems, leaves };
}

/** Outline of the wax in its 100×100 box. Also masks the light that glints across it. */
export const WAX_OUTLINE = waxOutline(7, 43);
const LAUREL = laurel(24.5);

/** The bitmap covers the 100×100 box plus this margin on every side, for the wax's shadow. */
export const WAX_MARGIN = 8;
const SPAN = 100 + 2 * WAX_MARGIN;
const SIZE = 420; // pixels; sharp at the largest size the seal is shown on a 3× screen
const PX = SIZE / SPAN; // pixels per unit

const FONT = '"Bodoni Moda Variable", "Bodoni 72", Didot, serif';

/** Gray levels of a canvas as 0…1 (red channel). */
function levels(ctx: CanvasRenderingContext2D): Float32Array {
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const out = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < out.length; i++) out[i] = data[i * 4] / 255;
  return out;
}

/** Gaussian blur, approximated by three box blurs in each direction. */
function blur(src: Float32Array, sigma: number): Float32Array {
  const boxes = [0, 1, 2].map(() => Math.max(0, Math.round((Math.sqrt((12 * sigma * sigma) / 3 + 1) - 1) / 2)));
  let a: Float32Array = src;
  let b: Float32Array = new Float32Array(src.length);
  for (const r of boxes) {
    for (const horizontal of [true, false]) {
      for (let line = 0; line < SIZE; line++) {
        let sum = 0;
        const at = (i: number) => {
          const c = Math.min(SIZE - 1, Math.max(0, i));
          return horizontal ? a[line * SIZE + c] : a[c * SIZE + line];
        };
        for (let i = -r; i <= r; i++) sum += at(i);
        for (let i = 0; i < SIZE; i++) {
          b[horizontal ? line * SIZE + i : i * SIZE + line] = sum / (2 * r + 1);
          sum += at(i + r + 1) - at(i - r);
        }
      }
      [a, b] = [b, a];
    }
  }
  return a;
}

/** Smooth value noise, for the slight mottling of poured wax. */
function mottle(seed: number, cells: number): (x: number, y: number) => number {
  const rand = seeded(seed);
  const grid = Array.from({ length: (cells + 1) * (cells + 1) }, rand);
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = (x / SIZE) * cells;
    const gy = (y / SIZE) * cells;
    const [ix, iy] = [Math.floor(gx), Math.floor(gy)];
    const [fx, fy] = [s(gx - ix), s(gy - iy)];
    const v = (i: number, j: number) => grid[Math.min(cells, iy + j) * (cells + 1) + Math.min(cells, ix + i)];
    return (v(0, 0) * (1 - fx) + v(1, 0) * fx) * (1 - fy) + (v(0, 1) * (1 - fx) + v(1, 1) * fx) * fy;
  };
}

function canvas(): CanvasRenderingContext2D {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.setTransform(PX, 0, 0, PX, WAX_MARGIN * PX, WAX_MARGIN * PX);
  return ctx;
}

const gray = (v: number) => `rgb(${v},${v},${v})`;

function monogram(ctx: CanvasRenderingContext2D, initials: [string, string]): void {
  ctx.textBaseline = 'alphabetic';
  const big = `italic 700 21px ${FONT}`;
  const small = `italic 700 13px ${FONT}`;
  ctx.font = big;
  const [w1, w3] = [ctx.measureText(initials[0]).width, ctx.measureText(initials[1]).width];
  ctx.font = small;
  const w2 = ctx.measureText('&').width;
  let x = 50 - (w1 + w2 + w3 + 1.2) / 2;
  ctx.font = big;
  ctx.fillText(initials[0], x, 57.5);
  x += w1 + 0.6;
  ctx.font = small;
  ctx.fillText('&', x, 56.5);
  x += w2 + 0.6;
  ctx.font = big;
  ctx.fillText(initials[1], x, 57.5);
}

function paint(initials: [string, string]): string {
  const outline = new Path2D(WAX_OUTLINE);

  // broad relief
  const broad = canvas();
  broad.fillStyle = gray(150);
  broad.fill(outline);
  broad.fillStyle = gray(95);
  broad.beginPath();
  broad.arc(50, 50, 31, 0, Math.PI * 2);
  broad.fill();
  broad.strokeStyle = gray(235);
  broad.lineWidth = 3.4;
  broad.beginPath();
  broad.arc(50, 50, 32.3, 0, Math.PI * 2);
  broad.stroke();
  broad.fillStyle = gray(120); // a few air bubbles caught in the wax
  for (const [x, y, r] of [
    [21, 30, 0.9],
    [77, 71, 0.7],
    [84, 36, 0.6],
    [27, 79, 0.8],
  ]) {
    broad.beginPath();
    broad.arc(x, y, r, 0, Math.PI * 2);
    broad.fill();
  }

  // fine engraving, raised in the wax
  const fine = canvas();
  fine.lineWidth = 0.7;
  fine.strokeStyle = gray(150);
  fine.beginPath();
  fine.arc(50, 50, 28.6, 0, Math.PI * 2);
  fine.stroke();
  fine.strokeStyle = gray(170);
  fine.stroke(new Path2D(LAUREL.stems));
  fine.fillStyle = gray(190);
  fine.fill(new Path2D(LAUREL.leaves));
  monogram(fine, initials);

  // coverage of the wax, for its edge and shadow
  const mask = canvas();
  mask.fillStyle = '#fff';
  mask.fill(outline);

  const hb = blur(levels(broad), 2.6 * PX);
  const hf = blur(levels(fine), 0.45 * PX);
  const alpha = levels(mask);
  const shade = blur(alpha, 0.8 * PX);
  const height = new Float32Array(hb.length);
  for (let i = 0; i < height.length; i++) height[i] = hb[i] + 0.55 * hf[i];

  // lights: azimuth 235° (top left), a low one for shading and a higher one for the gloss
  const light = (elevation: number) => {
    const [az, el] = [(235 * Math.PI) / 180, (elevation * Math.PI) / 180];
    return [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)];
  };
  const L = light(38);
  const G = light(52);
  const Hn = Math.hypot(G[0], G[1], G[2] + 1);
  const H = [G[0] / Hn, G[1] / Hn, (G[2] + 1) / Hn];
  // slope scale, matched to how the design was tuned (about 2.7 pixels per unit)
  const relief = (5 / 4) * (PX / 2.7);
  const noise = mottle(4, 9);
  const noiseFine = mottle(9, 26);

  const out = new ImageData(SIZE, SIZE);
  const px = out.data;
  const sx = Math.round(0.4 * PX);
  const sy = Math.round(1.1 * PX);
  const h = (x: number, y: number) =>
    height[Math.min(SIZE - 1, Math.max(0, y)) * SIZE + Math.min(SIZE - 1, Math.max(0, x))];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      // the wax's own shadow on the paper
      const sxy = Math.min(SIZE - 1, Math.max(0, y - sy)) * SIZE + Math.min(SIZE - 1, Math.max(0, x - sx));
      const shadowA = shade[sxy] * 0.45;
      const a = alpha[i];

      // shadow colour, premultiplied, under the wax
      const under = shadowA * (1 - a);
      let [r, g, b] = [(0x1b / 255) * under, (0x05 / 255) * under, (0x08 / 255) * under];
      if (a > 0) {
        // Sobel slopes → surface normal
        const gx =
          h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x - 1, y) - h(x - 1, y + 1);
        const gy =
          h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1) - h(x - 1, y - 1) - 2 * h(x, y - 1) - h(x + 1, y - 1);
        let [nx, ny, nz] = [-relief * gx, -relief * gy, 1];
        const n = Math.hypot(nx, ny, nz);
        [nx, ny, nz] = [nx / n, ny / n, nz / n];
        const diffuse = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        const spec = Math.pow(Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]), 32);

        // oxblood, slightly mottled where it was poured
        const m = 0.65 * noise(x, y) + 0.35 * noiseFine(x, y);
        const base = [0.44 + 0.12 * m, 0.045 + 0.02 * m, 0.085 + 0.03 * m];
        const gloss = 0.75 * spec * spec; // sharpened, like the premultiplied gloss of SVG lighting
        const tint = [1, 0.906, 0.886];
        const wax = base.map((c, k) => Math.min(1, Math.min(1, c * diffuse * 1.6) + gloss * tint[k]));
        r += wax[0] * a;
        g += wax[1] * a;
        b += wax[2] * a;
      }
      const o = a + under;
      if (o > 0) {
        px[i * 4] = Math.round((r / o) * 255);
        px[i * 4 + 1] = Math.round((g / o) * 255);
        px[i * 4 + 2] = Math.round((b / o) * 255);
        px[i * 4 + 3] = Math.round(o * 255);
      }
    }
  }

  const result = document.createElement('canvas');
  result.width = result.height = SIZE;
  result.getContext('2d')!.putImageData(out, 0, 0);
  return result.toDataURL('image/png');
}

const cache = new Map<string, Promise<string>>();

/** Data URL of the seal for these initials; painted once the monogram's font has loaded. */
export function waxSeal(initials: [string, string]): Promise<string> {
  const key = initials.join('&');
  let url = cache.get(key);
  if (!url) {
    url = document.fonts
      .load(`italic 700 21px ${FONT}`, initials.join('&'))
      .catch(() => undefined)
      .then(() => paint(initials));
    cache.set(key, url);
  }
  return url;
}

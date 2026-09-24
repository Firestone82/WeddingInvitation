/**
 * Paper textures, generated once as small tiling bitmaps. An SVG turbulence
 * filter would look the same but is re-rendered at every size and scale the
 * browser rasterizes it at, which is slow on phones.
 */

function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Tileable noise around 0.5, softened by a blur that wraps around the edges. */
function noise(size: number, seed: number, blurX: number, blurY: number): Float32Array {
  const rand = seeded(seed);
  let a = new Float32Array(size * size).map(() => (rand() + rand() + rand()) / 3);
  const pass = (src: Float32Array, r: number, horizontal: boolean) => {
    const out = new Float32Array(src.length);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) {
          const [sx, sy] = horizontal ? [(x + k + size) % size, y] : [x, (y + k + size) % size];
          sum += src[sy * size + sx];
        }
        out[y * size + x] = sum / (2 * r + 1);
      }
    }
    return out;
  };
  if (blurX) a = pass(a, blurX, true);
  if (blurY) a = pass(a, blurY, false);
  // stretch back to a fixed contrast after blurring
  const mean = a.reduce((s, v) => s + v, 0) / a.length;
  const sd = Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / a.length);
  return a.map((v) => 0.5 + ((v - mean) / sd) * 0.12);
}

function toUrl(size: number, pixel: (n: number) => [number, number, number, number], n: Float32Array): string {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < n.length; i++) {
    const [r, g, b, a] = pixel(n[i]);
    img.data.set([r, g, b, Math.round(Math.max(0, Math.min(1, a)) * 255)], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  return `url(${c.toDataURL('image/png')})`;
}

/** Fine dark and light specks, for the envelope's paper. */
export function grain(): string {
  return toUrl(
    128,
    (n) => (n > 0.5 ? [0, 0, 0, 0.45 * n - 0.2] : [255, 255, 255, 0.14 - 0.3 * n]),
    noise(128, 3, 0, 0),
  );
}

/** Short brown fibres running up and down, for the card's cotton paper. */
export function fibres(): string {
  return toUrl(160, (n) => [115, 84, 51, 0.45 * n - 0.235], noise(160, 8, 0, 1));
}

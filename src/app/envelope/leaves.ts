/** Generates blurred leaf-branch silhouettes for the dappled-light shadows on the intro. */

interface Pt {
  x: number;
  y: number;
}

const bez = (t: number, a: number, b: number, c: number, d: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
const bezD = (t: number, a: number, b: number, c: number, d: number) =>
  3 * (1 - t) ** 2 * (b - a) + 6 * (1 - t) * t * (c - b) + 3 * t ** 2 * (d - c);

function leaf(x: number, y: number, angle: number, len: number): string {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const w = len * 0.36;
  const f = (n: number) => n.toFixed(1);
  const tip = [x + cos * len, y + sin * len];
  const c1 = [x + cos * len * 0.5 - sin * w, y + sin * len * 0.5 + cos * w];
  const c2 = [x + cos * len * 0.5 + sin * w, y + sin * len * 0.5 - cos * w];
  return `M${f(x)} ${f(y)}Q${f(c1[0])} ${f(c1[1])} ${f(tip[0])} ${f(tip[1])}Q${f(c2[0])} ${f(c2[1])} ${f(x)} ${f(y)}Z`;
}

export function branch(
  p0: Pt,
  p1: Pt,
  p2: Pt,
  p3: Pt,
  count: number,
  maxLen: number,
): { stem: string; leaves: string } {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = 0.08 + (i / count) * 0.9;
    const x = bez(t, p0.x, p1.x, p2.x, p3.x);
    const y = bez(t, p0.y, p1.y, p2.y, p3.y);
    const dir = Math.atan2(bezD(t, p0.y, p1.y, p2.y, p3.y), bezD(t, p0.x, p1.x, p2.x, p3.x));
    const len = maxLen * (1 - t * 0.45);
    // pairs of leaves on both sides, slightly offset, like a real twig
    out.push(leaf(x, y, dir - 0.85 - (i % 3) * 0.06, len));
    out.push(leaf(x + 3, y + 2, dir + 0.8 + (i % 2) * 0.08, len * 0.92));
  }
  out.push(leaf(p3.x, p3.y, Math.atan2(p3.y - p2.y, p3.x - p2.x), maxLen * 0.7));
  return {
    stem: `M${p0.x} ${p0.y}C${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`,
    leaves: out.join(''),
  };
}

export const BRANCH_A = branch({ x: -30, y: -20 }, { x: 90, y: 50 }, { x: 170, y: 80 }, { x: 320, y: 170 }, 7, 62);
export const BRANCH_B = branch({ x: 430, y: 340 }, { x: 330, y: 290 }, { x: 250, y: 250 }, { x: 110, y: 200 }, 6, 58);

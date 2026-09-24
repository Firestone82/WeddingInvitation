import { Component, input } from '@angular/core';

interface Pt {
  x: number;
  y: number;
}

// Stem: cubic bezier from bottom-left to top-right.
const P0: Pt = { x: 8, y: 112 };
const P1: Pt = { x: 34, y: 78 };
const P2: Pt = { x: 70, y: 52 };
const P3: Pt = { x: 150, y: 14 };

const bez = (t: number, a: number, b: number, c: number, d: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
const bezD = (t: number, a: number, b: number, c: number, d: number) =>
  3 * (1 - t) ** 2 * (b - a) + 6 * (1 - t) * t * (c - b) + 3 * t ** 2 * (d - c);

/** Almond-shaped leaf growing from (x, y) at `angle`, `len` long. */
function leaf(x: number, y: number, angle: number, len: number): string {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const w = len * 0.34;
  const tip = { x: x + cos * len, y: y + sin * len };
  const c1 = { x: x + cos * len * 0.5 - sin * w, y: y + sin * len * 0.5 + cos * w };
  const c2 = { x: x + cos * len * 0.5 + sin * w, y: y + sin * len * 0.5 - cos * w };
  const f = (n: number) => n.toFixed(1);
  return `M${f(x)} ${f(y)}Q${f(c1.x)} ${f(c1.y)} ${f(tip.x)} ${f(tip.y)}Q${f(c2.x)} ${f(c2.y)} ${f(x)} ${f(y)}Z`;
}

const LEAVES = [0.14, 0.26, 0.38, 0.5, 0.62, 0.74, 0.86].flatMap((t, i) => {
  const x = bez(t, P0.x, P1.x, P2.x, P3.x);
  const y = bez(t, P0.y, P1.y, P2.y, P3.y);
  const dir = Math.atan2(bezD(t, P0.y, P1.y, P2.y, P3.y), bezD(t, P0.x, P1.x, P2.x, P3.x));
  const len = 24 - i * 2;
  const side = i % 2 === 0 ? -1 : 1;
  return [leaf(x, y, dir + side * 0.75, len)];
});

const STEM = `M${P0.x} ${P0.y}C${P1.x} ${P1.y} ${P2.x} ${P2.y} ${P3.x} ${P3.y}`;
const BUD = leaf(P3.x, P3.y, -0.42, 14);

@Component({
  selector: 'app-sprig',
  templateUrl: './sprig.html',
  styleUrl: './sprig.css',
  host: { 'aria-hidden': 'true', '[class.is-drawn]': 'drawn()' },
})
export class Sprig {
  readonly drawn = input(false);
  protected readonly stem = STEM;
  protected readonly leaves = LEAVES;
  protected readonly bud = BUD;
}

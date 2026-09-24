/** Geometry for the intro: torn paper edges and the fracture through the wax seal. */

type Pt = [number, number];

/** Deterministic pseudo-random numbers, so every visit tears the paper the same way. */
export function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const pct = ([x, y]: Pt) => `${x.toFixed(2)}% ${y.toFixed(2)}%`;

/**
 * A deckled (hand-torn) edge as a clip-path polygon. `depth` is how far the
 * fibres wander inwards, in percent of the width and height.
 */
export function deckle(seed: number, depth: Pt = [0.8, 1.1]): string {
  const rand = seeded(seed);
  const pts: Pt[] = [];
  const edge = (from: Pt, to: Pt, steps: number, inward: Pt) => {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      // two octaves: slow waviness plus fine fibres
      const d = 0.55 * rand() + 0.45 * Math.abs(Math.sin(t * 7 + rand()));
      pts.push([from[0] + (to[0] - from[0]) * t + inward[0] * d, from[1] + (to[1] - from[1]) * t + inward[1] * d]);
    }
  };
  edge([0, 0], [100, 0], 44, [0, depth[1]]);
  edge([100, 0], [100, 100], 32, [-depth[0], 0]);
  edge([100, 100], [0, 100], 44, [0, -depth[1]]);
  edge([0, 100], [0, 0], 32, [depth[0], 0]);
  return `polygon(${pts.map(pct).join(', ')})`;
}

export interface SealCrack {
  /** clip-path for the part of the seal that stays on the flap */
  top: string;
  /** clip-path for the part that stays on the envelope */
  bottom: string;
  /** SVG paths (100×100 seal box) running from the flap tip out to either side */
  left: string;
  right: string;
  /** the fracture line, in percent of the seal box */
  points: Pt[];
}

/**
 * The wax breaks where the flap pulls away from the envelope: along the flap's
 * edges, which meet in a blunt V at the centre of the seal. In the seal's own
 * box (percent), the flap tip is the centre and its edges rise at the slope of
 * the flap (0.85), with a short, flatter run into the tip.
 */
export function sealCrack(seed: number): SealCrack {
  const rand = seeded(seed);
  const tip: Pt = [50, 50];
  const knee = 17.4; // where the flap's straight edge meets its blunt tip
  const kneeY = 41.1;
  const endX = 58; // well past the seal's edge, so the clip covers it
  const endY = kneeY - (endX - knee) * 0.85;

  const run = (from: Pt, to: Pt, steps: number, jag: number): Pt[] => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy);
    const out: Pt[] = [];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const off = i === steps ? 0 : (rand() - 0.5) * 2 * jag;
      out.push([from[0] + dx * t - (dy / len) * off, from[1] + dy * t + (dx / len) * off]);
    }
    return out;
  };
  const side = (dir: -1 | 1): Pt[] => {
    const kneePt: Pt = [50 + dir * knee, kneeY];
    return [...run(tip, kneePt, 4, 1.4), ...run(kneePt, [50 + dir * endX, endY], 9, 2)];
  };

  const left = side(-1);
  const right = side(1);
  const line: Pt[] = [...left.slice().reverse(), tip, ...right];
  const path = (pts: Pt[]) => 'M50 50' + pts.map(([x, y]) => `L${x.toFixed(2)} ${y.toFixed(2)}`).join('');

  return {
    top: `polygon(${['-10% -30%', '110% -30%', ...line.slice().reverse().map(pct)].join(', ')})`,
    bottom: `polygon(${[...line.map(pct), '110% 110%', '-10% 110%'].join(', ')})`,
    left: path(left),
    right: path(right),
    points: line.filter(([x]) => x > 2 && x < 98),
  };
}

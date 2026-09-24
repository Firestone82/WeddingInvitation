import { Component, input } from '@angular/core';

let nextId = 0;

export interface Postmark {
  day: string;
  /** month in Roman numerals, as on old cancellation stamps */
  month: string;
  year: string;
}

/** Perforation holes along the stamp's edges (60 × 72 box). */
function perforation(): { x: number; y: number }[] {
  const holes: { x: number; y: number }[] = [];
  for (let x = 2.5; x < 60; x += 5) holes.push({ x, y: 0 }, { x, y: 72 });
  for (let y = 2.5; y < 72; y += 5) holes.push({ x: 0, y }, { x: 60, y });
  return holes;
}

/** Cancellation waves struck across the stamp. */
function waves(): string[] {
  return [0, 1, 2, 3, 4].map((i) => {
    const y = 9 + i * 5.2;
    let d = `M38 ${y}`;
    for (let x = 38; x < 104; x += 8) d += ` q2 -2.4 4 0 t4 0`;
    return d;
  });
}

/** A vintage postage stamp with the wedding date struck on it, for the front of the envelope. */
@Component({
  selector: 'app-postage',
  templateUrl: './postage.html',
  styleUrl: './postage.css',
  host: { 'aria-hidden': 'true' },
})
export class Postage {
  readonly initials = input.required<[string, string]>();
  readonly names = input.required<[string, string]>();
  readonly postmark = input.required<Postmark>();

  protected readonly id = `postage${nextId++}-`;
  protected readonly holes = perforation();
  protected readonly waves = waves();
}

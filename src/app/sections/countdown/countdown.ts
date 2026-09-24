import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { WEDDING } from '../../config/wedding.config';
import { pluralize } from '../../core/dates';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.html',
  styleUrl: './countdown.css',
  imports: [RevealDirective],
})
export class Countdown {
  protected readonly c = WEDDING;
  private readonly target = new Date(WEDDING.start).getTime();
  private readonly now = signal(Date.now());

  protected readonly left = computed(() => {
    const ms = this.target - this.now();
    if (ms <= 0) return null;
    const s = Math.floor(ms / 1000);
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    };
  });

  protected readonly units = computed(() => {
    const l = this.left();
    if (!l) return [];
    const u = this.c.countdown.units;
    const loc = this.c.locale;
    return (['days', 'hours', 'minutes', 'seconds'] as const).map((key) => ({
      key,
      value: l[key],
      label: pluralize(loc, l[key], u[key]),
    }));
  });

  constructor() {
    const id = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}

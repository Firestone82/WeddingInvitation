import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { prefersReducedMotion } from '../../core/browser';

/**
 * "There's more below" cue at the bottom of the first screen.
 * Appears after the hero has settled, hides once the guest scrolls,
 * and gently lifts the page once if nobody has scrolled yet.
 */
@Component({
  selector: 'app-scroll-cue',
  templateUrl: './scroll-cue.html',
  styleUrl: './scroll-cue.css',
  host: { '[class.is-visible]': 'visible()' },
})
export class ScrollCue {
  /** Start counting once the page is actually visible (envelope opened). */
  readonly active = input(false);
  readonly label = input.required<string>();
  /** Wait for the hero entrance to settle before showing the cue. */
  readonly delay = input(1800);

  private readonly shown = signal(false);
  private readonly atTop = signal(true);
  protected readonly visible = computed(() => this.shown() && this.atTop());

  private readonly reduced = prefersReducedMotion();
  private readonly timers: ReturnType<typeof setTimeout>[] = [];
  private everScrolled = false;

  constructor() {
    const onScroll = () => {
      const top = window.scrollY < 40;
      if (!top) this.everScrolled = true;
      if (top !== this.atTop()) this.atTop.set(top);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      this.timers.forEach(clearTimeout);
    });

    let started = false;
    effect(() => {
      if (!this.active() || started) return;
      started = true;
      this.timers.push(
        setTimeout(() => this.shown.set(true), this.delay()),
        // Nobody has scrolled yet: lift the page to show there is more.
        setTimeout(() => this.nudge(), this.delay() + 3500),
        setTimeout(() => this.nudge(), this.delay() + 11000),
      );
    });
  }

  protected go(): void {
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: this.reduced ? 'auto' : 'smooth' });
  }

  private nudge(): void {
    if (this.reduced || this.everScrolled || !this.atTop()) return;
    document
      .querySelector('main')
      ?.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-44px)', offset: 0.35 },
          { transform: 'translateY(0)', offset: 0.68 },
          { transform: 'translateY(-12px)', offset: 0.84 },
          { transform: 'translateY(0)' },
        ],
        { duration: 1300, easing: 'cubic-bezier(0.45, 0, 0.35, 1)' },
      );
  }
}

import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { WEDDING } from './config/wedding.config';
import { IntroState } from './core/intro-state';
import { formatShortDate } from './core/dates';
import { recipientFromUrl } from './core/browser';
import { Envelope } from './envelope/envelope';
import { Hero } from './sections/hero/hero';
import { Countdown } from './sections/countdown/countdown';
import { Schedule } from './sections/schedule/schedule';
import { Venue } from './sections/venue/venue';
import { DressCode } from './sections/dress-code/dress-code';
import { Menu } from './sections/menu/menu';
import { Details } from './sections/details/details';
import { Rsvp } from './sections/rsvp/rsvp';
import { Seal } from './shared/seal/seal';
import { Sprig } from './shared/sprig/sprig';
import { ScrollCue } from './shared/scroll-cue/scroll-cue';

@Component({
  selector: 'app-root',
  imports: [Envelope, Hero, Countdown, Schedule, Venue, DressCode, Menu, Details, Rsvp, Seal, Sprig, ScrollCue],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly c = WEDDING;
  protected readonly opened = inject(IntroState).opened;
  protected readonly showIntro = signal(true);
  protected readonly playing = signal(false);

  private readonly guest = recipientFromUrl();
  protected readonly recipient = this.guest
    ? `${WEDDING.envelope.recipientPrefix} ${this.guest}`
    : WEDDING.envelope.recipient;
  protected readonly names: [string, string] = [WEDDING.couple.first, WEDDING.couple.second];
  protected readonly shortDate = formatShortDate(WEDDING.locale, WEDDING.timeZone, WEDDING.start);

  private readonly audio = WEDDING.music ? new Audio(WEDDING.music.src) : null;

  constructor() {
    history.scrollRestoration = 'manual';

    effect(() => document.documentElement.classList.toggle('intro-open', !this.opened()));

    if (this.audio) {
      this.audio.loop = true;
      this.audio.volume = 0.55;
      this.audio.preload = 'auto';
      const sync = () => this.playing.set(!this.audio!.paused);
      this.audio.addEventListener('play', sync);
      this.audio.addEventListener('pause', sync);
      inject(DestroyRef).onDestroy(() => this.audio?.pause());
    }
  }

  /** Runs inside the click, so browsers allow the music to start. */
  protected onOpening(): void {
    this.audio?.play().catch(() => this.playing.set(false));
  }

  protected onRevealed(): void {
    window.scrollTo({ top: 0 });
    this.opened.set(true);
  }

  protected toggleMusic(): void {
    if (!this.audio) return;
    this.audio.paused ? this.audio.play().catch(() => {}) : this.audio.pause();
  }
}

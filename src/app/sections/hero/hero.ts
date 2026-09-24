import { Component, ElementRef, effect, input, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { WEDDING } from '../../config/wedding.config';
import { capitalize, formatLongDate, formatTime } from '../../core/dates';
import { downloadIcs, googleCalendarUrl } from '../../core/calendar';
import { Sprig } from '../../shared/sprig/sprig';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  imports: [NgTemplateOutlet, Sprig],
  host: { '[class.is-ready]': 'ready()' },
})
export class Hero {
  readonly ready = input(false);

  protected readonly c = WEDDING;
  protected readonly date = capitalize(formatLongDate(WEDDING.locale, WEDDING.timeZone, WEDDING.start));
  protected readonly time = formatTime(WEDDING.locale, WEDDING.timeZone, WEDDING.start);
  protected readonly googleUrl = googleCalendarUrl(WEDDING);

  private readonly title = viewChild.required<ElementRef<HTMLElement>>('title');

  constructor() {
    // Move focus to the names once the envelope is gone, for keyboard and screen reader users.
    effect(() => {
      if (this.ready()) this.title().nativeElement.focus({ preventScroll: true });
    });
  }

  protected saveIcs(): void {
    downloadIcs(this.c);
  }
}

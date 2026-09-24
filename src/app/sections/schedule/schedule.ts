import { Component } from '@angular/core';
import { WEDDING } from '../../config/wedding.config';
import { RevealDirective } from '../../core/reveal.directive';
import { ScrollProgressDirective } from '../../core/scroll-progress.directive';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
  imports: [RevealDirective, ScrollProgressDirective],
})
export class Schedule {
  protected readonly c = WEDDING;
}

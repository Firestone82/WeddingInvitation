import { Component } from '@angular/core';
import { WEDDING } from '../../config/wedding.config';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-details',
  templateUrl: './details.html',
  styleUrl: './details.css',
  imports: [RevealDirective],
})
export class Details {
  protected readonly d = WEDDING.details;
}

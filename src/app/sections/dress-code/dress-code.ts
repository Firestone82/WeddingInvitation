import { Component } from '@angular/core';
import { WEDDING } from '../../config/wedding.config';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-dress-code',
  templateUrl: './dress-code.html',
  styleUrl: './dress-code.css',
  imports: [RevealDirective],
})
export class DressCode {
  protected readonly d = WEDDING.dressCode;
}

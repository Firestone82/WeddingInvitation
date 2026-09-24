import { Component } from '@angular/core';
import { WEDDING } from '../../config/wedding.config';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.html',
  styleUrl: './menu.css',
  imports: [RevealDirective],
})
export class Menu {
  protected readonly m = WEDDING.menu;
}

import { afterNextRender, Component, input, signal } from '@angular/core';
import { waxSeal } from './wax';

export { WAX_OUTLINE } from './wax';

/**
 * A wax seal. It is painted once into a bitmap (see wax.ts) and shown as an
 * image, so animating it is as cheap as moving a picture.
 */
@Component({
  selector: 'app-seal',
  templateUrl: './seal.html',
  styleUrl: './seal.css',
  host: { 'aria-hidden': 'true' },
})
export class Seal {
  readonly initials = input.required<[string, string]>();
  protected readonly src = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      waxSeal(this.initials()).then((url) => this.src.set(url));
    });
  }
}

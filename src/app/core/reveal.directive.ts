import { DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';
import { IntroState } from './intro-state';

export type RevealVariant = 'rise' | 'ink' | 'unfold' | 'drop' | 'arch' | 'side';

/**
 * Adds `is-revealed` once the element scrolls into view.
 * The look of each variant is defined in styles.css under [data-reveal].
 */
@Directive({
  selector: '[appReveal]',
  host: {
    '[attr.data-reveal]': 'appReveal() || "rise"',
    '[style.--reveal-delay]': 'revealDelay() + "ms"',
  },
})
export class RevealDirective {
  readonly appReveal = input<RevealVariant | ''>('rise');
  readonly revealDelay = input(0);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    const intro = inject(IntroState);
    let observer: IntersectionObserver | undefined;
    destroyRef.onDestroy(() => observer?.disconnect());

    // Start watching only once the envelope is open, so nothing reveals unseen behind it.
    effect(() => {
      if (!intro.opened() || observer) return;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('is-revealed');
            observer?.disconnect();
          }
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
      );
      observer.observe(el);
    });
  }
}

import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/**
 * Exposes how far the element has travelled through the viewport as `--progress` (0 → 1).
 * Used to draw the timeline line as the guest scrolls.
 */
@Directive({ selector: '[appScrollProgress]' })
export class ScrollProgressDirective {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      let frame = 0;
      const update = () => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when the top reaches 75% of the viewport, 1 when the bottom reaches 55%.
        const start = vh * 0.75;
        const end = vh * 0.55;
        const total = rect.height + (start - end);
        const progress = Math.min(1, Math.max(0, (start - rect.top) / total));
        el.style.setProperty('--progress', progress.toFixed(3));
      };
      const onScroll = () => (frame ||= requestAnimationFrame(update));

      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      });
    });
  }
}

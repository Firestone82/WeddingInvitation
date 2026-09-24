import { Injectable, signal } from '@angular/core';

/** Shared flag: has the guest opened the envelope yet? */
@Injectable({ providedIn: 'root' })
export class IntroState {
  readonly opened = signal(false);
}

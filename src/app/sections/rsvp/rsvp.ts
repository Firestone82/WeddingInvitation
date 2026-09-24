import { Component, computed, ElementRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { WEDDING } from '../../config/wedding.config';
import { formatShortDate } from '../../core/dates';
import { recipientFromUrl } from '../../core/browser';
import { RevealDirective } from '../../core/reveal.directive';
import { Seal } from '../../shared/seal/seal';

type Status = 'idle' | 'sending' | 'sent' | 'mail' | 'error';

@Component({
  selector: 'app-rsvp',
  templateUrl: './rsvp.html',
  styleUrl: './rsvp.css',
  imports: [ReactiveFormsModule, RevealDirective, Seal],
})
export class Rsvp {
  protected readonly c = WEDDING;
  protected readonly r = WEDDING.rsvp;
  protected readonly l = WEDDING.rsvp.labels;
  protected readonly deadline = formatShortDate(WEDDING.locale, WEDDING.timeZone, `${WEDDING.rsvp.deadline}T12:00:00Z`);
  protected readonly status = signal<Status>('idle');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    attending: ['' as '' | 'yes' | 'no', Validators.required],
    guests: [1, [Validators.min(1), Validators.max(WEDDING.rsvp.maxGuests)]],
    diet: [''],
    message: [''],
  });

  private readonly attending = toSignal(this.form.controls.attending.valueChanges, { initialValue: '' as const });
  protected readonly isComing = computed(() => this.attending() === 'yes');
  protected readonly guests = toSignal(this.form.controls.guests.valueChanges, { initialValue: 1 });

  protected showError(control: 'name' | 'attending'): boolean {
    const c = this.form.controls[control];
    return c.invalid && c.touched;
  }

  protected step(delta: number): void {
    const next = Math.min(this.r.maxGuests, Math.max(1, this.form.controls.guests.value + delta));
    this.form.controls.guests.setValue(next);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.host.querySelector<HTMLElement>('.ng-invalid:not(form) input, input.ng-invalid')?.focus();
      return;
    }

    const v = this.form.getRawValue();
    const reply = {
      name: v.name.trim(),
      attending: v.attending === 'yes',
      guests: v.attending === 'yes' ? v.guests : 0,
      diet: v.attending === 'yes' ? v.diet.trim() : '',
      message: v.message.trim(),
      invitation: recipientFromUrl(),
      sentAt: new Date().toISOString(),
    };

    if (!this.r.endpoint) {
      this.openMail(reply);
      return;
    }

    this.status.set('sending');
    try {
      const res = await fetch(this.r.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(reply),
      });
      this.status.set(res.ok ? 'sent' : 'error');
    } catch {
      this.status.set('error');
    }
  }

  private openMail(reply: { name: string; attending: boolean; guests: number; diet: string; message: string }): void {
    const l = this.l;
    const lines = [
      `${l.name}: ${reply.name}`,
      `${l.attending} ${reply.attending ? l.accept : l.decline}`,
      ...(reply.attending ? [`${l.guests} ${reply.guests}`] : []),
      ...(reply.diet ? [`${l.diet}: ${reply.diet}`] : []),
      ...(reply.message ? ['', reply.message] : []),
    ];
    const subject = `${l.mailSubject}: ${reply.name}`;
    window.location.href = `mailto:${this.r.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    this.status.set('mail');
  }
}

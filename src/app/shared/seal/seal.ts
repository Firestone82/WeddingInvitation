import { Component, input } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-seal',
  templateUrl: './seal.html',
  styleUrl: './seal.css',
  host: { 'aria-hidden': 'true' },
})
export class Seal {
  readonly initials = input.required<[string, string]>();
  protected readonly id = `seal${nextId++}-`;
}

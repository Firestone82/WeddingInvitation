import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { WEDDING } from '../../config/wedding.config';
import { defaultMapLinks } from '../../core/maps';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-venue',
  templateUrl: './venue.html',
  styleUrl: './venue.css',
  imports: [RevealDirective],
})
export class Venue {
  protected readonly v = WEDDING.venue;
  protected readonly links = this.v.links.length ? this.v.links : defaultMapLinks(this.v.lat, this.v.lng);
  protected readonly mapUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    `https://maps.google.com/maps?q=${this.v.lat},${this.v.lng}&z=15&hl=${WEDDING.locale.slice(0, 2)}&output=embed`,
  );
}

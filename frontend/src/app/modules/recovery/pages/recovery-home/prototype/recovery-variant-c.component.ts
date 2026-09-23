// PROTOTYPE — Variant C: "Tiered urgency stack". Strong visual hierarchy —
// recommended options prominent, last-resort collapsed behind an expander, the
// current-bus candidate deliberately muted even inside Recommended so staying on the
// wrong bus never reads as a normal, equally-good choice.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { PROTOTYPE_LAST_RESORT, PROTOTYPE_RECOMMENDED, PROTOTYPE_UNCONFIRMED_RAIL } from './prototype-mock-data';

@Component({
    selector: 'app-recovery-variant-c',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './recovery-variant-c.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecoveryVariantCComponent {
    readonly recommended = PROTOTYPE_RECOMMENDED;
    readonly lastResort = PROTOTYPE_LAST_RESORT;
    readonly unconfirmedRail = PROTOTYPE_UNCONFIRMED_RAIL;

    readonly lastResortExpanded = signal(false);

    toggleLastResort(): void {
        this.lastResortExpanded.set(!this.lastResortExpanded());
    }
}

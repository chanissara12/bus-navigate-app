// PROTOTYPE — Variant A: "List-first sectioned". Single scroll with section headers
// (Recommended / Last resort / Unconfirmed rail); the current-bus option sits inline
// in Recommended with a small "(คันเดิม)" tag, not otherwise highlighted.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROTOTYPE_LAST_RESORT, PROTOTYPE_RECOMMENDED, PROTOTYPE_UNCONFIRMED_RAIL } from './prototype-mock-data';

@Component({
    selector: 'app-recovery-variant-a',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './recovery-variant-a.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecoveryVariantAComponent {
    readonly recommended = PROTOTYPE_RECOMMENDED;
    readonly lastResort = PROTOTYPE_LAST_RESORT;
    readonly unconfirmedRail = PROTOTYPE_UNCONFIRMED_RAIL;
}

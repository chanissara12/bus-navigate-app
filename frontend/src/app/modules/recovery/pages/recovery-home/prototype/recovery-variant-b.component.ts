// PROTOTYPE — Variant B: "Split list + reasons detail". Grouped rows on the left;
// selecting one shows its evaluation reasons on the right.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
    PROTOTYPE_LAST_RESORT,
    PROTOTYPE_RECOMMENDED,
    PROTOTYPE_UNCONFIRMED_RAIL,
    PrototypeRecoveryOption
} from './prototype-mock-data';

const ALL_OPTIONS = [...PROTOTYPE_RECOMMENDED, ...PROTOTYPE_LAST_RESORT, ...PROTOTYPE_UNCONFIRMED_RAIL];

@Component({
    selector: 'app-recovery-variant-b',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './recovery-variant-b.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecoveryVariantBComponent {
    readonly recommended = PROTOTYPE_RECOMMENDED;
    readonly lastResort = PROTOTYPE_LAST_RESORT;
    readonly unconfirmedRail = PROTOTYPE_UNCONFIRMED_RAIL;

    readonly selectedId = signal(ALL_OPTIONS[0]?.id ?? '');

    readonly selected = computed<PrototypeRecoveryOption | undefined>(() =>
        ALL_OPTIONS.find((o) => o.id === this.selectedId())
    );

    select(id: string): void {
        this.selectedId.set(id);
    }
}

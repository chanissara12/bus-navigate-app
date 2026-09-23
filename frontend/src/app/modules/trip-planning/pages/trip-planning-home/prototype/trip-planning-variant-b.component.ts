// PROTOTYPE — Variant B: "Split list + journey detail". Compact rows on the left;
// selecting a row expands a step-by-step journey timeline on the right. No map —
// route-map visualization is explicitly deferred out of Phase 1 scope (map.md).
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { PROTOTYPE_DESTINATION, PROTOTYPE_TRAVEL_OPTIONS, PrototypeTravelOption } from './prototype-mock-data';
import { prototypeStatusClasses, prototypeStatusLabel } from './prototype-status';

@Component({
    selector: 'app-trip-planning-variant-b',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './trip-planning-variant-b.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripPlanningVariantBComponent {
    readonly destination = PROTOTYPE_DESTINATION;
    readonly options = PROTOTYPE_TRAVEL_OPTIONS;
    readonly statusLabel = prototypeStatusLabel;
    readonly statusClasses = prototypeStatusClasses;

    readonly selectedId = signal(PROTOTYPE_TRAVEL_OPTIONS[0]?.id ?? '');

    get selectedOption(): PrototypeTravelOption | undefined {
        return this.options.find((o) => o.id === this.selectedId());
    }

    select(id: string): void {
        this.selectedId.set(id);
    }
}

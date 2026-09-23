// PROTOTYPE — Variant B: "Split map + list". Compact rows on the left, a map
// placeholder on the right; selecting a row updates the summary panel below the map.
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

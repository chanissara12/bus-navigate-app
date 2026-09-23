// PROTOTYPE — Variant C: "Comparison carousel". Compact search bar, options laid
// out side-by-side for direct numeric comparison rather than a single scrolling list.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROTOTYPE_DESTINATION, PROTOTYPE_TRAVEL_OPTIONS } from './prototype-mock-data';
import { prototypeStatusClasses, prototypeStatusLabel } from './prototype-status';

@Component({
    selector: 'app-trip-planning-variant-c',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './trip-planning-variant-c.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripPlanningVariantCComponent {
    readonly destination = PROTOTYPE_DESTINATION;
    readonly options = PROTOTYPE_TRAVEL_OPTIONS;
    readonly statusLabel = prototypeStatusLabel;
    readonly statusClasses = prototypeStatusClasses;
}

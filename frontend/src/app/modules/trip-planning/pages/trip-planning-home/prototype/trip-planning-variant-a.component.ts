// PROTOTYPE — Variant A: "List-first". Search on top, results as full-width stacked cards.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROTOTYPE_DESTINATION, PROTOTYPE_TRAVEL_OPTIONS } from './prototype-mock-data';
import { prototypeStatusClasses, prototypeStatusLabel } from './prototype-status';

@Component({
    selector: 'app-trip-planning-variant-a',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './trip-planning-variant-a.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripPlanningVariantAComponent {
    readonly destination = PROTOTYPE_DESTINATION;
    readonly options = PROTOTYPE_TRAVEL_OPTIONS;
    readonly statusLabel = prototypeStatusLabel;
    readonly statusClasses = prototypeStatusClasses;
}

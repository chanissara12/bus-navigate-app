// PROTOTYPE — Variant A: "List-first accordion". Nearby stops as a stacked list;
// tapping a row expands its landmark context inline, below that row.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { PROTOTYPE_NEARBY_STOPS } from './prototype-mock-data';
import { prototypeLandmarkIcon, prototypeLandmarkLabel } from './prototype-landmark';

@Component({
    selector: 'app-bus-stop-variant-a',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './bus-stop-variant-a.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusStopVariantAComponent {
    readonly stops = PROTOTYPE_NEARBY_STOPS;
    readonly landmarkIcon = prototypeLandmarkIcon;
    readonly landmarkLabel = prototypeLandmarkLabel;

    readonly expandedId = signal<number | undefined>(undefined);

    toggle(id: number): void {
        this.expandedId.set(this.expandedId() === id ? undefined : id);
    }
}

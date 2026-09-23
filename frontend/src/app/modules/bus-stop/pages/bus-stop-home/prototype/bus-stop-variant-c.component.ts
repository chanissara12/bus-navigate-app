// PROTOTYPE — Variant C: "Walking-guide focus". Single nearest stop, landmarks
// presented as an ordered walking guide (closest first) instead of a list/split view.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROTOTYPE_NEARBY_STOPS } from './prototype-mock-data';
import { prototypeLandmarkIcon, prototypeLandmarkLabel } from './prototype-landmark';

@Component({
    selector: 'app-bus-stop-variant-c',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './bus-stop-variant-c.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusStopVariantCComponent {
    readonly nearestStop = PROTOTYPE_NEARBY_STOPS[0];
    readonly otherStops = PROTOTYPE_NEARBY_STOPS.slice(1);
    readonly landmarkIcon = prototypeLandmarkIcon;
    readonly landmarkLabel = prototypeLandmarkLabel;

    readonly orderedLandmarks = [...(this.nearestStop?.landmarks ?? [])].sort(
        (a, b) => a.distanceMeters - b.distanceMeters
    );
}

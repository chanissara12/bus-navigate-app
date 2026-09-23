// PROTOTYPE — Variant B: "Split list + grouped detail". Compact nearby-stop rows on
// the left; selecting one shows its landmarks grouped by LandmarkType on the right.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { PROTOTYPE_NEARBY_STOPS, PrototypeLandmarkType, PrototypeStopLandmark } from './prototype-mock-data';
import { prototypeLandmarkIcon, prototypeLandmarkLabel } from './prototype-landmark';

interface LandmarkGroup {
    type: PrototypeLandmarkType;
    landmarks: PrototypeStopLandmark[];
}

@Component({
    selector: 'app-bus-stop-variant-b',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './bus-stop-variant-b.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusStopVariantBComponent {
    readonly stops = PROTOTYPE_NEARBY_STOPS;
    readonly landmarkIcon = prototypeLandmarkIcon;
    readonly landmarkLabel = prototypeLandmarkLabel;

    readonly selectedId = signal(PROTOTYPE_NEARBY_STOPS[0]?.id ?? 0);

    readonly selectedStop = computed(() => this.stops.find((s) => s.id === this.selectedId()));

    readonly groupedLandmarks = computed<LandmarkGroup[]>(() => {
        const landmarks = this.selectedStop()?.landmarks ?? [];
        const byType = new Map<PrototypeLandmarkType, PrototypeStopLandmark[]>();
        for (const landmark of landmarks) {
            const group = byType.get(landmark.landmarkType) ?? [];
            group.push(landmark);
            byType.set(landmark.landmarkType, group);
        }
        return Array.from(byType.entries()).map(([type, items]) => ({ type, landmarks: items }));
    });

    select(id: number): void {
        this.selectedId.set(id);
    }
}

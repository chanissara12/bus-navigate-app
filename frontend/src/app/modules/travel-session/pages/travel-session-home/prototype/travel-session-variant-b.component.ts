// PROTOTYPE — Variant B: "Step timeline". The whole journey shown as a vertical
// stepper (past states checked off, current highlighted, upcoming greyed).
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { PROTOTYPE_PROGRESS, PROTOTYPE_STATES, PrototypeSessionState } from './prototype-mock-data';
import { PrototypeStateSelectorComponent } from './prototype-state-selector.component';

// Misboarded/Completed aren't steps on the normal-flow timeline — Misboarded branches
// off it (shown as a banner instead), Completed replaces the timeline entirely.
const TIMELINE_STATES: PrototypeSessionState[] = ['Planned', 'WalkingToStop', 'Waiting', 'Riding', 'Alighted'];

@Component({
    selector: 'app-travel-session-variant-b',
    standalone: true,
    imports: [CommonModule, PrototypeStateSelectorComponent],
    templateUrl: './travel-session-variant-b.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelSessionVariantBComponent {
    readonly demoState = signal<PrototypeSessionState>('Riding');
    readonly progress = PROTOTYPE_PROGRESS;
    readonly timelineStates = TIMELINE_STATES.map((state) => PROTOTYPE_STATES.find((s) => s.state === state)!);

    readonly currentIndex = computed(() => TIMELINE_STATES.indexOf(this.demoState()));

    get isMisboarded(): boolean {
        return this.demoState() === 'Misboarded';
    }

    get isCompleted(): boolean {
        return this.demoState() === 'Completed';
    }

    get isRiding(): boolean {
        return this.demoState() === 'Riding';
    }

    stepStatus(index: number): 'done' | 'current' | 'upcoming' {
        if (index < this.currentIndex()) return 'done';
        if (index === this.currentIndex()) return 'current';
        return 'upcoming';
    }

    setState(state: PrototypeSessionState): void {
        this.demoState.set(state);
    }
}

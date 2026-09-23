// PROTOTYPE — Variant A: "Single status card". One persistent card whose content
// swaps per TravelSessionState — same shell throughout, no per-state screen swap.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { PROTOTYPE_PROGRESS, prototypeStateInfo, PrototypeSessionState } from './prototype-mock-data';
import { PrototypeStateSelectorComponent } from './prototype-state-selector.component';

@Component({
    selector: 'app-travel-session-variant-a',
    standalone: true,
    imports: [CommonModule, PrototypeStateSelectorComponent],
    templateUrl: './travel-session-variant-a.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelSessionVariantAComponent {
    readonly demoState = signal<PrototypeSessionState>('Riding');
    readonly progress = PROTOTYPE_PROGRESS;

    get current() {
        return prototypeStateInfo(this.demoState());
    }

    get isMisboarded(): boolean {
        return this.demoState() === 'Misboarded';
    }

    get isRiding(): boolean {
        return this.demoState() === 'Riding';
    }

    setState(state: PrototypeSessionState): void {
        this.demoState.set(state);
    }
}

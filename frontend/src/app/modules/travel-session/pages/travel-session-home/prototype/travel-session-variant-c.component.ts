// PROTOTYPE — Variant C: "Full-screen state takeover". Each state gets its own
// full-bleed color/hero treatment instead of a shared card or timeline shell.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { PROTOTYPE_PROGRESS, prototypeStateInfo, PrototypeSessionState } from './prototype-mock-data';
import { PrototypeStateSelectorComponent } from './prototype-state-selector.component';

const STATE_COLOR_CLASSES: Record<PrototypeSessionState, string> = {
    Planned: 'bg-slate-100 text-slate-900',
    WalkingToStop: 'bg-sky-100 text-sky-900',
    Waiting: 'bg-amber-100 text-amber-900',
    Riding: 'bg-sky-600 text-white',
    Misboarded: 'bg-red-600 text-white',
    Alighted: 'bg-emerald-100 text-emerald-900',
    Completed: 'bg-emerald-600 text-white'
};

@Component({
    selector: 'app-travel-session-variant-c',
    standalone: true,
    imports: [CommonModule, PrototypeStateSelectorComponent],
    templateUrl: './travel-session-variant-c.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelSessionVariantCComponent {
    readonly demoState = signal<PrototypeSessionState>('Riding');
    readonly progress = PROTOTYPE_PROGRESS;

    get current() {
        return prototypeStateInfo(this.demoState());
    }

    get colorClasses(): string {
        return STATE_COLOR_CLASSES[this.demoState()];
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

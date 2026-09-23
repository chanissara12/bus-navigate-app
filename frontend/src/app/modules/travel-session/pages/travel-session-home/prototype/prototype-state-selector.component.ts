// PROTOTYPE — demo-only control to preview how a variant adapts across
// TravelSessionState values. Not part of the A/B/C layout switcher.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { PROTOTYPE_STATES, PrototypeSessionState } from './prototype-mock-data';

@Component({
    selector: 'app-prototype-state-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './prototype-state-selector.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrototypeStateSelectorComponent {
    @Input({ required: true }) current!: PrototypeSessionState;
    @Output() currentChange = new EventEmitter<PrototypeSessionState>();

    readonly states = PROTOTYPE_STATES;
}

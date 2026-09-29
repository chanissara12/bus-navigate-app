import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

// Accessible on/off switch — role="switch" (not "checkbox": this takes effect
// immediately, it isn't a form selection) with aria-checked and CSS-only styling
// (native checkboxes are hard to restyle consistently, see confirm-dialog/route-map-card
// for the same standalone shared-component pattern).
@Component({
    selector: 'app-toggle-switch',
    standalone: true,
    imports: [],
    templateUrl: './toggle-switch.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleSwitchComponent {
    @Input({ required: true }) label = '';
    @Input({ required: true }) checked = false;
    @Input() testId: string | undefined;

    @Output() readonly checkedChange = new EventEmitter<boolean>();

    onToggle(): void {
        this.checkedChange.emit(!this.checked);
    }
}

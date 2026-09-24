import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

// Generic confirm/cancel dialog, no variants — every state-changing action (T04 event
// buttons, ReportedWrongBus, ConfirmedRecovery) goes through this first since backend
// transitions are one-way with no undo.
@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './confirm-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
    @Input({ required: true }) open = false;
    @Input({ required: true }) title = '';
    @Input({ required: true }) message = '';
    @Input() confirmLabel = 'ยืนยัน';
    @Input() cancelLabel = 'ยกเลิก';
    // True while the parent's confirmed action is in flight (e.g. an HTTP call) —
    // disables both buttons and blocks Escape/backdrop dismissal so a slow request
    // can't be double-submitted or cancelled out from under itself.
    @Input() confirming = false;

    @Output() readonly confirmed = new EventEmitter<void>();
    @Output() readonly cancelled = new EventEmitter<void>();

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.open && !this.confirming) {
            this.cancelled.emit();
        }
    }

    onConfirm(): void {
        this.confirmed.emit();
    }

    onCancel(): void {
        if (!this.confirming) {
            this.cancelled.emit();
        }
    }
}

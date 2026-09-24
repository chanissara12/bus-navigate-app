// PROTOTYPE — Variant D: "Shimmer cards + contextual banner". Same skeleton as
// Variant B (matches the real card's shape). The error banner differs: instead of
// living at a screen edge (B: top, C: bottom-right — both went unnoticed per
// feedback), it appears full-width right where the action happened — directly below
// the button row here, standing in for "right above the results/control that failed"
// on a real page. Single latest message (replaces the previous one), manual dismiss
// only, with a brief slide-down entrance so it catches the eye even if the user isn't
// looking at that exact spot yet.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';

import { ErrorNotificationService } from '../../services/error-notification.service';
import { DEMO_CARD, DEMO_ERROR_MESSAGES, DEMO_LIST_ITEMS } from './loading-error-demo-data';

@Component({
    selector: 'app-loading-error-variant-d',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './loading-error-variant-d.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingErrorVariantDComponent {
    private readonly changeDetectorRef = inject(ChangeDetectorRef);
    private readonly errorNotificationService = inject(ErrorNotificationService);
    private nextErrorIndex = 0;

    readonly listItems = DEMO_LIST_ITEMS;
    readonly card = DEMO_CARD;

    readonly listLoading = signal(false);
    readonly cardLoading = signal(false);
    readonly latestError = signal<string | undefined>(undefined);
    // Starts each new error off-screen/transparent, then flips true a tick later so
    // the CSS transition actually animates instead of snapping straight to visible.
    readonly errorSettled = signal(false);

    constructor(destroyRef: DestroyRef) {
        const subscription = this.errorNotificationService.errors$.subscribe((message) => {
            this.latestError.set(message);
            this.errorSettled.set(false);
            this.changeDetectorRef.markForCheck();
            setTimeout(() => {
                this.errorSettled.set(true);
                this.changeDetectorRef.markForCheck();
            });
        });
        destroyRef.onDestroy(() => subscription.unsubscribe());
    }

    simulateListLoad(): void {
        this.listLoading.set(true);
        setTimeout(() => this.listLoading.set(false), 1200);
    }

    simulateCardLoad(): void {
        this.cardLoading.set(true);
        setTimeout(() => this.cardLoading.set(false), 1200);
    }

    triggerError(): void {
        this.errorNotificationService.notify(DEMO_ERROR_MESSAGES[this.nextErrorIndex % DEMO_ERROR_MESSAGES.length]);
        this.nextErrorIndex++;
    }

    dismissError(): void {
        this.latestError.set(undefined);
    }
}

// PROTOTYPE — Variant A: "Minimal inline". Plain gray-bar skeletons; the error banner
// is page-local (rendered inline at the top of this panel, not fixed), shows only the
// newest message (replaces the previous one), dismissed with an explicit × button.
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';

import { ErrorNotificationService } from '../../services/error-notification.service';
import { DEMO_CARD, DEMO_ERROR_MESSAGES, DEMO_LIST_ITEMS } from './loading-error-demo-data';

@Component({
    selector: 'app-loading-error-variant-a',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './loading-error-variant-a.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingErrorVariantAComponent {
    private readonly changeDetectorRef = inject(ChangeDetectorRef);
    private readonly errorNotificationService = inject(ErrorNotificationService);
    private nextErrorIndex = 0;

    readonly listItems = DEMO_LIST_ITEMS;
    readonly card = DEMO_CARD;

    readonly listLoading = signal(false);
    readonly cardLoading = signal(false);
    readonly latestError = signal<string | undefined>(undefined);

    constructor(destroyRef: DestroyRef) {
        const subscription = this.errorNotificationService.errors$.subscribe((message) => {
            this.latestError.set(message);
            this.changeDetectorRef.markForCheck();
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

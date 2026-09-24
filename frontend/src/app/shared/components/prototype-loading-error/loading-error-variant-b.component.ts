// PROTOTYPE — Variant B: "Shimmer cards + top banner stack". Skeleton shapes closely
// match the real card's dimensions (circle badge + lines). The error banner is
// app-shell-shaped: fixed to the very top of the viewport, full width, stacking every
// message as its own row, each auto-dismissing after 4s (or manually).
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';

import { ErrorNotificationService } from '../../services/error-notification.service';
import { DEMO_CARD, DEMO_ERROR_MESSAGES, DEMO_LIST_ITEMS } from './loading-error-demo-data';

interface ToastMessage {
    id: number;
    message: string;
}

const AUTO_DISMISS_MS = 4000;

@Component({
    selector: 'app-loading-error-variant-b',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './loading-error-variant-b.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingErrorVariantBComponent {
    private readonly changeDetectorRef = inject(ChangeDetectorRef);
    private readonly errorNotificationService = inject(ErrorNotificationService);
    private nextErrorIndex = 0;
    private nextToastId = 0;

    readonly listItems = DEMO_LIST_ITEMS;
    readonly card = DEMO_CARD;

    readonly listLoading = signal(false);
    readonly cardLoading = signal(false);
    readonly toasts = signal<ToastMessage[]>([]);

    constructor(destroyRef: DestroyRef) {
        const subscription = this.errorNotificationService.errors$.subscribe((message) => {
            const toast: ToastMessage = { id: this.nextToastId++, message };
            this.toasts.update((current) => [...current, toast]);
            this.changeDetectorRef.markForCheck();
            setTimeout(() => this.dismissToast(toast.id), AUTO_DISMISS_MS);
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

    dismissToast(id: number): void {
        this.toasts.update((current) => current.filter((toast) => toast.id !== id));
    }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, switchMap, timer } from 'rxjs';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TravelSessionProgress } from '../../../../shared/models/travel-session-progress.model';
import { TravelSessionResponse } from '../../../../shared/models/travel-session.model';
import { TravelSessionState } from '../../../../shared/models/travel-session-state.model';
import { ActiveSessionService } from '../../../../shared/services/active-session.service';
import { ErrorNotificationService } from '../../../../shared/services/error-notification.service';
import { TravelSessionsService } from '../../../../shared/services/travel-sessions.service';

const PROGRESS_POLL_INTERVAL_MS = 20_000;

@Component({
    selector: 'app-travel-session-home',
    standalone: true,
    imports: [CommonModule, ConfirmDialogComponent],
    templateUrl: './travel-session-home.component.html',
    styleUrl: './travel-session-home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelSessionHomeComponent {
    readonly TravelSessionState = TravelSessionState;

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly activeSessionService = inject(ActiveSessionService);
    private readonly travelSessionsService = inject(TravelSessionsService);
    private readonly errorNotificationService = inject(ErrorNotificationService);
    private readonly destroyRef = inject(DestroyRef);
    private progressSubscription: Subscription | undefined;

    readonly sessionId = signal<number | undefined>(undefined);
    readonly state = signal<TravelSessionState>(TravelSessionState.Planned);
    readonly destinationNameTh = signal('');
    readonly destinationNameEn = signal('');
    readonly walkingDistanceMeters = signal(0);
    readonly progress = signal<TravelSessionProgress | undefined>(undefined);
    readonly loading = signal(true);
    readonly confirming = signal(false);
    readonly dialogOpen = signal(false);
    readonly dialogKind = signal<'advance' | 'wrong-bus' | undefined>(undefined);
    readonly latestError = signal<string | undefined>(undefined);

    readonly stateLabel = (state: TravelSessionState): string => {
        switch (state) {
            case TravelSessionState.Planned: return 'วางแผนแล้ว';
            case TravelSessionState.WalkingToStop: return 'กำลังเดินไปป้าย';
            case TravelSessionState.Waiting: return 'รอรถ';
            case TravelSessionState.Riding: return 'กำลังเดินทาง';
            case TravelSessionState.Misboarded: return 'ขึ้นรถผิดคัน';
            case TravelSessionState.Alighted: return 'ลงรถแล้ว';
            case TravelSessionState.Completed: return 'ถึงจุดหมายแล้ว';
            case TravelSessionState.Abandoned: return 'ยุติการเดินทาง';
        }
    };

    readonly stateIcon = (state: TravelSessionState): string => {
        switch (state) {
            case TravelSessionState.Planned: return '🗺️';
            case TravelSessionState.WalkingToStop: return '🚶';
            case TravelSessionState.Waiting: return '⏳';
            case TravelSessionState.Riding: return '🚌';
            case TravelSessionState.Misboarded: return '⚠️';
            case TravelSessionState.Alighted: return '🏁';
            case TravelSessionState.Completed: return '✅';
            case TravelSessionState.Abandoned: return '⏹️';
        }
    };

    readonly actionLabel = (): string | undefined => {
        switch (this.state()) {
            case TravelSessionState.Planned: return 'เริ่มเดินไปป้าย';
            case TravelSessionState.WalkingToStop: return 'ถึงป้ายแล้ว';
            case TravelSessionState.Waiting: return 'ขึ้นรถแล้ว';
            case TravelSessionState.Riding: return 'ลงรถแล้ว';
            case TravelSessionState.Alighted: return 'ถึงจุดหมายแล้ว';
            default: return undefined;
        }
    };

    constructor() {
        this.loadSession();

        this.errorNotificationService.errors$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((message) => this.latestError.set(message));
    }

    openAdvanceConfirmation(): void {
        if (this.actionLabel() === undefined) {
            return;
        }

        this.dialogKind.set('advance');
        this.dialogOpen.set(true);
    }

    openWrongBusConfirmation(): void {
        if (this.state() !== TravelSessionState.Waiting && this.state() !== TravelSessionState.Riding) {
            return;
        }

        this.dialogKind.set('wrong-bus');
        this.dialogOpen.set(true);
    }

    closeDialog(): void {
        if (!this.confirming()) {
            this.dialogOpen.set(false);
            this.dialogKind.set(undefined);
        }
    }

    confirmAction(): void {
        const sessionId = this.sessionId();
        const kind = this.dialogKind();
        if (sessionId === undefined || kind === undefined || this.confirming()) {
            return;
        }

        const eventType = kind === 'wrong-bus'
            ? 'reported_wrong_bus'
            : this.eventTypeForState(this.state());

        if (eventType === undefined) {
            return;
        }

        this.confirming.set(true);
        this.travelSessionsService
            .sendEvent(sessionId, eventType)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (session) => {
                    this.applySessionResponse(session);
                    this.confirming.set(false);
                    this.dialogOpen.set(false);
                    this.dialogKind.set(undefined);

                    if (session.state === TravelSessionState.Misboarded) {
                        this.goToRecovery();
                    }
                },
                error: (err: Error) => {
                    this.confirming.set(false);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }

    goToRecovery(): void {
        const sessionId = this.sessionId();
        if (sessionId !== undefined) {
            this.router.navigate(['/recovery', sessionId]);
        }
    }

    dismissError(): void {
        this.latestError.set(undefined);
    }

    private loadSession(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!Number.isInteger(id) || id <= 0) {
            this.loading.set(false);
            this.errorNotificationService.notify('ไม่พบรหัสการเดินทาง');
            return;
        }

        this.sessionId.set(id);
        this.activeSessionService.setActiveSessionId(id);

        this.travelSessionsService
            .get(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (session) => {
                    this.applySessionResponse(session);
                    this.loading.set(false);
                },
                error: (err: Error) => {
                    this.loading.set(false);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }

    private applySessionResponse(session: TravelSessionResponse): void {
        this.state.set(session.state);
        this.destinationNameTh.set(session.alightingStopNameTh);
        this.destinationNameEn.set(session.alightingStopNameEn);
        this.walkingDistanceMeters.set(session.walkingDistanceMeters);
        this.activeSessionService.updateFromState(session.state);

        if (session.state === TravelSessionState.Riding) {
            this.startProgressPolling();
        } else {
            this.stopProgressPolling();
            this.progress.set(undefined);
        }
    }

    private startProgressPolling(): void {
        const sessionId = this.sessionId();
        if (sessionId === undefined) {
            return;
        }

        this.stopProgressPolling();

        this.progressSubscription = timer(0, PROGRESS_POLL_INTERVAL_MS)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap(() => this.travelSessionsService.getProgress(sessionId))
            )
            .subscribe({
                next: (progress) => this.progress.set(progress),
                error: (err: Error) => this.errorNotificationService.notify(err.message)
            });
    }

    private stopProgressPolling(): void {
        this.progressSubscription?.unsubscribe();
        this.progressSubscription = undefined;
    }

    private eventTypeForState(state: TravelSessionState): string | undefined {
        switch (state) {
            case TravelSessionState.Planned: return 'started_walking';
            case TravelSessionState.WalkingToStop: return 'arrived_at_stop';
            case TravelSessionState.Waiting: return 'boarded';
            case TravelSessionState.Riding: return 'alighted';
            case TravelSessionState.Alighted: return 'reached_destination';
            default: return undefined;
        }
    }
}

import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ConfirmedRecoverySelection } from '../../../../shared/models/confirmed-recovery-selection.model';
import { TravelSessionResponse } from '../../../../shared/models/travel-session.model';
import { ErrorNotificationService } from '../../../../shared/services/error-notification.service';
import { GeolocationService } from '../../../../shared/services/geolocation.service';
import { TravelSessionsService } from '../../../../shared/services/travel-sessions.service';
import { ReasonCode } from '../../../trip-planning/models/travel-option.model';
import {
    RecoveryOption,
    RecoveryOptionKind,
    RecoveryOptionsResult
} from '../../models/recovery-option.model';
import { RecoveryService } from '../../services/recovery.service';

@Component({
    selector: 'app-recovery-home',
    templateUrl: './recovery-home.component.html',
    styleUrl: './recovery-home.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecoveryHomeComponent {
    readonly RecoveryOptionKind = RecoveryOptionKind;

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly recoveryService = inject(RecoveryService);
    private readonly travelSessionsService = inject(TravelSessionsService);
    private readonly geolocationService = inject(GeolocationService);
    private readonly errorNotificationService = inject(ErrorNotificationService);
    private readonly destroyRef = inject(DestroyRef);

    readonly sessionId = signal<number | undefined>(undefined);
    readonly recommendedOptions = signal<RecoveryOption[]>([]);
    readonly lastResortOptions = signal<RecoveryOption[]>([]);
    readonly unconfirmedRailPointers = signal<RecoveryOption[]>([]);
    readonly loading = signal(true);
    readonly confirming = signal(false);
    readonly dialogOpen = signal(false);
    readonly selectedOption = signal<RecoveryOption | undefined>(undefined);
    readonly lastResortExpanded = signal(false);
    readonly latestError = signal<string | undefined>(undefined);

    constructor() {
        this.errorNotificationService.errors$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((message) => this.latestError.set(message));

        this.loadRecoveryOptions();
    }

    retry(): void {
        this.loadRecoveryOptions();
    }

    toggleLastResort(): void {
        this.lastResortExpanded.update((expanded) => !expanded);
    }

    openConfirmation(option: RecoveryOption): void {
        if (option.kind !== RecoveryOptionKind.BusDirection || this.confirming()) {
            return;
        }

        this.selectedOption.set(option);
        this.dialogOpen.set(true);
    }

    closeDialog(): void {
        if (!this.confirming()) {
            this.dialogOpen.set(false);
            this.selectedOption.set(undefined);
        }
    }

    confirmRecovery(): void {
        const sessionId = this.sessionId();
        const option = this.selectedOption();

        if (sessionId === undefined || option === undefined || this.confirming()) {
            return;
        }

        this.confirming.set(true);

        const selection: ConfirmedRecoverySelection = {
            directionId: option.isCurrentBus ? null : option.directionId,
            boardingStopId: option.isCurrentBus ? null : option.boardingStopId,
            alightingStopId: option.isCurrentBus ? null : option.alightingStopId,
            isCurrentBus: option.isCurrentBus
        };

        this.travelSessionsService
            .sendEvent(sessionId, 'confirmed_recovery', selection)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.confirming.set(false);
                    this.dialogOpen.set(false);
                    this.selectedOption.set(undefined);
                    this.router.navigate(['/travel-session', sessionId]);
                },
                error: (err: Error) => {
                    this.confirming.set(false);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }

    formatDistance(distanceMeters: number): string {
        return Math.round(distanceMeters) + ' ม.';
    }

    formatReason(reason: { code: ReasonCode; value: number | null }): string {
        switch (reason.code) {
            case ReasonCode.ReachesDestination:
                return 'ถึงจุดหมายได้';
            case ReasonCode.DoesNotReachDestination:
                return 'ไม่ถึงจุดหมาย';
            case ReasonCode.FasterBy:
                return reason.value === null ? 'เร็วกว่า' : 'เร็วกว่า ' + Math.round(reason.value) + ' นาที';
            case ReasonCode.SlowerBy:
                return reason.value === null ? 'ช้ากว่า' : 'ช้ากว่า ' + Math.round(reason.value) + ' นาที';
            case ReasonCode.NoTransfer:
                return 'ไม่ต้องต่อรถ';
            case ReasonCode.ExtraTransferCount:
                return reason.value === null ? 'มีการต่อรถเพิ่ม' : 'ต่อรถเพิ่ม ' + Math.round(reason.value) + ' ครั้ง';
            case ReasonCode.ExtraWalkDistance:
                return reason.value === null ? 'เดินเพิ่ม' : 'เดินเพิ่ม ' + Math.round(reason.value) + ' ม.';
            case ReasonCode.WithinWalkBudget:
                return 'อยู่ในระยะเดินที่กำหนด';
            case ReasonCode.ExceedsWalkBudget:
                return 'เดินเกินระยะที่กำหนด';
        }
    }

    private loadRecoveryOptions(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!Number.isInteger(id) || id <= 0) {
            this.loading.set(false);
            this.errorNotificationService.notify('ไม่พบรหัสการเดินทาง');
            return;
        }

        this.sessionId.set(id);
        this.loading.set(true);

        this.travelSessionsService
            .get(id)
            .pipe(
                switchMap((session) =>
                    this.geolocationService
                        .getCurrentPosition()
                        .pipe(
                            switchMap((coordinates) =>
                                this.recoveryService.getOptions(
                                    session.id,
                                    coordinates.latitude,
                                    coordinates.longitude,
                                    session.directionId
                                )
                            )
                        )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (result) => {
                    this.applyOptions(result);
                    this.loading.set(false);
                },
                error: (err: Error) => {
                    this.loading.set(false);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }

    private applyOptions(result: RecoveryOptionsResult): void {
        this.recommendedOptions.set(result.recommendedOptions);
        this.lastResortOptions.set(result.lastResortOptions);
        this.unconfirmedRailPointers.set(result.unconfirmedRailPointers);
        this.lastResortExpanded.set(false);
    }
}
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ErrorNotificationService } from '../../services/error-notification.service';
import { UserPreferenceService } from '../../services/user-preference.service';
import { ToggleSwitchComponent } from '../toggle-switch/toggle-switch.component';

// Simple settings form (02) for the three accessibility-preference toggles. Content
// only — no page chrome (width/position/shadow) — so it can be embedded anywhere a
// host wants to show it (currently: a popover anchored to trip-planning's settings
// icon). 01's PUT is a full replace, so save always sends all three values together,
// never a per-toggle patch.
@Component({
    selector: 'app-preference-panel',
    standalone: true,
    imports: [ToggleSwitchComponent],
    templateUrl: './preference-panel.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreferencePanelComponent {
    private readonly userPreferenceService = inject(UserPreferenceService);
    private readonly errorNotificationService = inject(ErrorNotificationService);
    private readonly destroyRef = inject(DestroyRef);

    // Emits once a save actually succeeds — lets a host (e.g. a popover) close itself.
    @Output() readonly saved = new EventEmitter<void>();

    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly justSaved = signal(false);

    readonly minimizeWalking = signal(false);
    readonly minimizeTransfers = signal(false);
    readonly avoidStreetCrossing = signal(false);

    readonly latestError = signal<string | undefined>(undefined);

    constructor() {
        this.errorNotificationService.errors$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((message) => this.latestError.set(message));

        this.loadPreference();
    }

    save(): void {
        if (this.saving()) {
            return;
        }

        this.saving.set(true);
        this.justSaved.set(false);

        this.userPreferenceService
            .save({
                minimizeWalking: this.minimizeWalking(),
                minimizeTransfers: this.minimizeTransfers(),
                avoidStreetCrossing: this.avoidStreetCrossing()
            })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.justSaved.set(true);
                    this.saved.emit();
                },
                error: (err: Error) => {
                    this.saving.set(false);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }

    private loadPreference(): void {
        this.loading.set(true);
        this.userPreferenceService
            .get()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (preference) => {
                    this.minimizeWalking.set(preference.minimizeWalking);
                    this.minimizeTransfers.set(preference.minimizeTransfers);
                    this.avoidStreetCrossing.set(preference.avoidStreetCrossing);
                    this.loading.set(false);
                },
                error: (err: Error) => {
                    this.loading.set(false);
                    this.errorNotificationService.notify(err.message);
                }
            });
    }
}

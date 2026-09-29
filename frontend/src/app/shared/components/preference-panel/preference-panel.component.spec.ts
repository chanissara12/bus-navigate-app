import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { PreferencePanelComponent } from './preference-panel.component';
import { UserPreference } from '../../models/user-preference.model';
import { UserPreferenceService } from '../../services/user-preference.service';
import { ErrorNotificationService } from '../../services/error-notification.service';

describe('PreferencePanelComponent', () => {
    let component: PreferencePanelComponent;
    let fixture: ComponentFixture<PreferencePanelComponent>;
    let userPreferenceService: { get: jest.Mock; save: jest.Mock };
    let errorNotificationService: { notify: jest.Mock; errors$: ReturnType<typeof of> };

    const savedPreference: UserPreference = {
        minimizeWalking: true,
        minimizeTransfers: false,
        avoidStreetCrossing: true,
        updatedAt: '2026-09-28T00:00:00Z'
    };

    function setup(preference: UserPreference = savedPreference): void {
        userPreferenceService = {
            get: jest.fn().mockReturnValue(of(preference)),
            save: jest.fn().mockReturnValue(of(preference))
        };
        errorNotificationService = { notify: jest.fn(), errors$: of() };

        TestBed.configureTestingModule({
            imports: [PreferencePanelComponent],
            providers: [
                { provide: UserPreferenceService, useValue: userPreferenceService },
                { provide: ErrorNotificationService, useValue: errorNotificationService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PreferencePanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it('shows each toggle in its currently-saved state', () => {
        setup();

        expect(userPreferenceService.get).toHaveBeenCalled();
        expect(component.loading()).toBe(false);
        expect(component.minimizeWalking()).toBe(true);
        expect(component.minimizeTransfers()).toBe(false);
        expect(component.avoidStreetCrossing()).toBe(true);
    });

    it('defaults every toggle to off for a device that never set anything', () => {
        setup({ minimizeWalking: false, minimizeTransfers: false, avoidStreetCrossing: false, updatedAt: null });

        expect(component.minimizeWalking()).toBe(false);
        expect(component.minimizeTransfers()).toBe(false);
        expect(component.avoidStreetCrossing()).toBe(false);
    });

    it('turning a toggle off is just as direct as turning it on, and save sends the full set', () => {
        setup();

        fixture.debugElement.query(By.css('[data-testid="toggle-minimize-walking"]')).nativeElement.click();
        fixture.detectChanges();
        component.save();

        expect(component.minimizeWalking()).toBe(false);
        expect(userPreferenceService.save).toHaveBeenCalledWith({
            minimizeWalking: false,
            minimizeTransfers: false,
            avoidStreetCrossing: true
        });
        expect(component.saving()).toBe(false);
        expect(component.justSaved()).toBe(true);
    });

    it('emits saved once the save request succeeds, so a host can auto-close', () => {
        setup();
        const savedHandler = jest.fn();
        component.saved.subscribe(savedHandler);

        component.save();

        expect(savedHandler).toHaveBeenCalledTimes(1);
    });

    it('does not emit saved and stops saving when the save request fails', () => {
        setup();
        userPreferenceService.save.mockReturnValue(throwError(() => new Error('save failed')));
        const savedHandler = jest.fn();
        component.saved.subscribe(savedHandler);

        component.save();

        expect(component.saving()).toBe(false);
        expect(component.justSaved()).toBe(false);
        expect(savedHandler).not.toHaveBeenCalled();
        expect(errorNotificationService.notify).toHaveBeenCalledWith('save failed');
    });

    it('stops loading and reports an error when the initial fetch fails', () => {
        userPreferenceService = {
            get: jest.fn().mockReturnValue(throwError(() => new Error('load failed'))),
            save: jest.fn()
        };
        errorNotificationService = { notify: jest.fn(), errors$: of() };

        TestBed.configureTestingModule({
            imports: [PreferencePanelComponent],
            providers: [
                { provide: UserPreferenceService, useValue: userPreferenceService },
                { provide: ErrorNotificationService, useValue: errorNotificationService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PreferencePanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.loading()).toBe(false);
        expect(errorNotificationService.notify).toHaveBeenCalledWith('load failed');
    });
});

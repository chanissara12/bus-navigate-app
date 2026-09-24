import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { ActiveSessionService } from '../../services/active-session.service';
import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
    let fixture: ComponentFixture<BottomNavComponent>;
    let routerEvents: Subject<NavigationEnd>;
    let router: {
        events: Subject<NavigationEnd>;
        url: string;
        navigate: jest.Mock;
        createUrlTree: jest.Mock;
        serializeUrl: jest.Mock;
    };
    let activeSessionService: { getActiveSessionId: jest.Mock };

    function setup(initialUrl: string): void {
        routerEvents = new Subject<NavigationEnd>();
        router = {
            events: routerEvents,
            url: initialUrl,
            navigate: jest.fn(),
            createUrlTree: jest.fn().mockReturnValue({}),
            serializeUrl: jest.fn().mockReturnValue('#')
        };
        activeSessionService = { getActiveSessionId: jest.fn() };

        TestBed.configureTestingModule({
            imports: [BottomNavComponent],
            providers: [
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: { snapshot: {} } },
                { provide: ActiveSessionService, useValue: activeSessionService }
            ]
        });
        fixture = TestBed.createComponent(BottomNavComponent);
        fixture.detectChanges();
    }

    it('renders the three tab labels', () => {
        setup('/trip-planning');

        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
        expect(text).toContain('ค้นหาเส้นทาง');
        expect(text).toContain('ป้ายรถ');
        expect(text).toContain('การเดินทางของฉัน');
    });

    it('marks trip-planning as the active tab on the initial url', () => {
        setup('/trip-planning');

        const tab = fixture.debugElement.query(By.css('[data-testid="nav-tab-trip-planning"]'));
        expect(tab.classes['text-sky-600']).toBe(true);
    });

    it('updates the active tab after a NavigationEnd event', () => {
        setup('/trip-planning');

        routerEvents.next(new NavigationEnd(1, '/bus-stop', '/bus-stop'));
        fixture.detectChanges();

        const busStopTab = fixture.debugElement.query(By.css('[data-testid="nav-tab-bus-stop"]'));
        const tripPlanningTab = fixture.debugElement.query(By.css('[data-testid="nav-tab-trip-planning"]'));
        expect(busStopTab.classes['text-sky-600']).toBe(true);
        expect(tripPlanningTab.classes['text-sky-600']).toBeFalsy();
    });

    it('treats a /travel-session/:id url as the travel-session tab being active', () => {
        setup('/travel-session/42');

        const tab = fixture.debugElement.query(By.css('[data-testid="nav-tab-travel-session"]'));
        expect(tab.classes['text-sky-600']).toBe(true);
    });

    it('navigates to the persisted session when the travel-session tab is clicked and a session is active', () => {
        setup('/trip-planning');
        activeSessionService.getActiveSessionId.mockReturnValue(42);

        fixture.debugElement.query(By.css('[data-testid="nav-tab-travel-session"]')).nativeElement.click();

        expect(router.navigate).toHaveBeenCalledWith(['/travel-session', 42]);
    });

    it('navigates to trip-planning when the travel-session tab is clicked and no session is active', () => {
        setup('/trip-planning');
        activeSessionService.getActiveSessionId.mockReturnValue(undefined);

        fixture.debugElement.query(By.css('[data-testid="nav-tab-travel-session"]')).nativeElement.click();

        expect(router.navigate).toHaveBeenCalledWith(['/trip-planning']);
    });
});

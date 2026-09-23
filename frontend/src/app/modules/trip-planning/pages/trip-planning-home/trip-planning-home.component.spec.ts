import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripPlanningHomeComponent } from './trip-planning-home.component';

describe('TripPlanningHomeComponent', () => {
    let component: TripPlanningHomeComponent;
    let fixture: ComponentFixture<TripPlanningHomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TripPlanningHomeComponent]
        })
        .compileComponents();

        fixture = TestBed.createComponent(TripPlanningHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { TripPlanningModule } from '../../trip-planning.module';
import { TripPlanningHomeComponent } from './trip-planning-home.component';

describe('TripPlanningHomeComponent', () => {
    let component: TripPlanningHomeComponent;
    let fixture: ComponentFixture<TripPlanningHomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TripPlanningModule, RouterTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
                }
            ]
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

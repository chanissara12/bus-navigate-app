import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { TravelSessionModule } from '../../travel-session.module';
import { TravelSessionHomeComponent } from './travel-session-home.component';

describe('TravelSessionHomeComponent', () => {
    let component: TravelSessionHomeComponent;
    let fixture: ComponentFixture<TravelSessionHomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TravelSessionModule, RouterTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
                }
            ]
        })
        .compileComponents();

        fixture = TestBed.createComponent(TravelSessionHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

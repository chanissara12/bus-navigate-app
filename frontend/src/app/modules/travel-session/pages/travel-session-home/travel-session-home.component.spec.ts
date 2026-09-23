import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelSessionHomeComponent } from './travel-session-home.component';

describe('TravelSessionHomeComponent', () => {
    let component: TravelSessionHomeComponent;
    let fixture: ComponentFixture<TravelSessionHomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TravelSessionHomeComponent]
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

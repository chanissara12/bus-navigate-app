import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusStopHomeComponent } from './bus-stop-home.component';

describe('BusStopHomeComponent', () => {
    let component: BusStopHomeComponent;
    let fixture: ComponentFixture<BusStopHomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BusStopHomeComponent]
        })
        .compileComponents();

        fixture = TestBed.createComponent(BusStopHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

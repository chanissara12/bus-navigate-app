import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { BusStopModule } from '../../bus-stop.module';
import { BusStopHomeComponent } from './bus-stop-home.component';

describe('BusStopHomeComponent', () => {
    let component: BusStopHomeComponent;
    let fixture: ComponentFixture<BusStopHomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BusStopModule, RouterTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
                }
            ]
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

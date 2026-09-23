import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { RecoveryModule } from '../../recovery.module';
import { RecoveryHomeComponent } from './recovery-home.component';

describe('RecoveryHomeComponent', () => {
    let component: RecoveryHomeComponent;
    let fixture: ComponentFixture<RecoveryHomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RecoveryModule, RouterTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
                }
            ]
        })
        .compileComponents();

        fixture = TestBed.createComponent(RecoveryHomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

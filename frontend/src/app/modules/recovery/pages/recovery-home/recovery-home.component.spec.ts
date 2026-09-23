import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoveryHomeComponent } from './recovery-home.component';

describe('RecoveryHomeComponent', () => {
    let component: RecoveryHomeComponent;
    let fixture: ComponentFixture<RecoveryHomeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RecoveryHomeComponent]
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

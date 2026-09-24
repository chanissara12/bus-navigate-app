import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
    let fixture: ComponentFixture<ConfirmDialogComponent>;
    let component: ConfirmDialogComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [ConfirmDialogComponent] });
        fixture = TestBed.createComponent(ConfirmDialogComponent);
        component = fixture.componentInstance;
        component.title = 'ยืนยันการดำเนินการ';
        component.message = 'คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?';
    });

    it('renders nothing when open is false', () => {
        component.open = false;
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('[role="dialog"]'))).toBeNull();
    });

    it('renders the title and message when open is true', () => {
        component.open = true;
        fixture.detectChanges();

        const dialog = fixture.debugElement.query(By.css('[role="dialog"]'));
        expect(dialog).not.toBeNull();
        expect(fixture.nativeElement.textContent).toContain('ยืนยันการดำเนินการ');
        expect(fixture.nativeElement.textContent).toContain('คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?');
    });

    it('emits confirmed when the confirm button is clicked', () => {
        component.open = true;
        fixture.detectChanges();
        const confirmed = jest.fn();
        component.confirmed.subscribe(confirmed);

        fixture.debugElement.query(By.css('[data-testid="confirm-dialog-confirm"]')).nativeElement.click();

        expect(confirmed).toHaveBeenCalledTimes(1);
    });

    it('emits cancelled when the cancel button is clicked', () => {
        component.open = true;
        fixture.detectChanges();
        const cancelled = jest.fn();
        component.cancelled.subscribe(cancelled);

        fixture.debugElement.query(By.css('[data-testid="confirm-dialog-cancel"]')).nativeElement.click();

        expect(cancelled).toHaveBeenCalledTimes(1);
    });

    it('uses the default Thai labels when none are provided', () => {
        component.open = true;
        fixture.detectChanges();

        expect(
            fixture.debugElement.query(By.css('[data-testid="confirm-dialog-confirm"]')).nativeElement.textContent
        ).toContain('ยืนยัน');
        expect(
            fixture.debugElement.query(By.css('[data-testid="confirm-dialog-cancel"]')).nativeElement.textContent
        ).toContain('ยกเลิก');
    });

    it('emits cancelled when Escape is pressed while open', () => {
        component.open = true;
        fixture.detectChanges();
        const cancelled = jest.fn();
        component.cancelled.subscribe(cancelled);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        expect(cancelled).toHaveBeenCalledTimes(1);
    });

    it('does not emit cancelled on Escape when closed', () => {
        component.open = false;
        fixture.detectChanges();
        const cancelled = jest.fn();
        component.cancelled.subscribe(cancelled);

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        expect(cancelled).not.toHaveBeenCalled();
    });
});

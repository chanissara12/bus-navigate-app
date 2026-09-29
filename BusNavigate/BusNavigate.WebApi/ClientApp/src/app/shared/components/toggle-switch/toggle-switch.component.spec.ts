import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ToggleSwitchComponent } from './toggle-switch.component';

describe('ToggleSwitchComponent', () => {
    let fixture: ComponentFixture<ToggleSwitchComponent>;
    let component: ToggleSwitchComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [ToggleSwitchComponent] });
        fixture = TestBed.createComponent(ToggleSwitchComponent);
        component = fixture.componentInstance;
        component.label = 'ลดระยะเดิน';
    });

    it('renders the label and reflects the checked input via aria-checked', () => {
        component.checked = true;
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('ลดระยะเดิน');
        expect(fixture.debugElement.query(By.css('[role="switch"]')).attributes['aria-checked']).toBe('true');
    });

    it('reflects checked false via aria-checked', () => {
        component.checked = false;
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('[role="switch"]')).attributes['aria-checked']).toBe('false');
    });

    it('emits checkedChange with the negated value when clicked', () => {
        component.checked = false;
        fixture.detectChanges();
        const checkedChange = jest.fn();
        component.checkedChange.subscribe(checkedChange);

        fixture.debugElement.query(By.css('[role="switch"]')).nativeElement.click();

        expect(checkedChange).toHaveBeenCalledWith(true);
    });

    it('renders the testId as data-testid when provided', () => {
        component.testId = 'toggle-minimize-walking';
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('[data-testid="toggle-minimize-walking"]'))).not.toBeNull();
    });
});

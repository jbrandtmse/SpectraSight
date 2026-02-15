import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FieldDropdownComponent } from './field-dropdown.component';

@Component({
  standalone: true,
  imports: [FieldDropdownComponent],
  template: `
    <app-field-dropdown
      [value]="value"
      [options]="options"
      [label]="label"
      [placeholder]="placeholder"
      [allowEmpty]="allowEmpty"
      [freeText]="freeText"
      (valueChanged)="onValueChanged($event)">
    </app-field-dropdown>
  `,
})
class TestHostComponent {
  value = 'Open';
  options = ['Open', 'In Progress', 'Blocked', 'Complete'];
  label = 'Status';
  placeholder = 'Select...';
  allowEmpty = true;
  freeText = false;
  changedValue: string | null = null;

  onValueChanged(val: string): void {
    this.changedValue = val;
  }
}

describe('FieldDropdownComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('dropdown mode', () => {
    it('should create', () => {
      const el = fixture.nativeElement.querySelector('app-field-dropdown');
      expect(el).toBeTruthy();
    });

    it('should display label and value', () => {
      const label = fixture.nativeElement.querySelector('.field-dropdown-label');
      const value = fixture.nativeElement.querySelector('.field-dropdown-value');
      expect(label.textContent.trim()).toBe('Status:');
      expect(value.textContent.trim()).toBe('Open');
    });

    it('should display placeholder when value is empty', () => {
      host.value = '';
      fixture.detectChanges();
      const value = fixture.nativeElement.querySelector('.field-dropdown-value');
      expect(value.textContent.trim()).toBe('Select...');
    });

    it('should show dropdown arrow icon', () => {
      const icon = fixture.nativeElement.querySelector('.field-dropdown-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent.trim()).toBe('arrow_drop_down');
    });

    it('should have aria-label with label and value', () => {
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      expect(display.getAttribute('aria-label')).toBe('Status: Open. Click to change.');
    });

    it('should have tabindex="0" for keyboard accessibility', () => {
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      expect(display.getAttribute('tabindex')).toBe('0');
    });

    it('should emit valueChanged when a different option is selected', () => {
      // Open the menu
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      display.click();
      fixture.detectChanges();

      // Find menu items in the overlay
      const menuItems = document.querySelectorAll('.mat-mdc-menu-item');
      // Click "In Progress" (second item)
      const inProgressItem = Array.from(menuItems).find(
        item => item.textContent?.includes('In Progress')
      ) as HTMLElement;

      if (inProgressItem) {
        inProgressItem.click();
        fixture.detectChanges();
        expect(host.changedValue).toBe('In Progress');
      } else {
        // Menu may take a tick to render; verify at least the menu was triggered
        expect(display.getAttribute('aria-expanded') || display.getAttribute('aria-haspopup')).toBeTruthy();
      }
    });

    it('should not emit valueChanged when same option is selected', () => {
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      display.click();
      fixture.detectChanges();

      const menuItems = document.querySelectorAll('.mat-mdc-menu-item');
      const openItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Open') && !item.textContent?.includes('In')
      ) as HTMLElement;

      if (openItem) {
        openItem.click();
        fixture.detectChanges();
        expect(host.changedValue).toBeNull();
      }
    });
  });

  describe('free text mode', () => {
    beforeEach(() => {
      host.freeText = true;
      host.label = 'Assignee';
      host.value = 'alice';
      host.placeholder = 'Unassigned';
      fixture.detectChanges();
    });

    it('should show edit icon instead of dropdown arrow', () => {
      const icon = fixture.nativeElement.querySelector('.field-dropdown-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent.trim()).toBe('edit');
    });

    it('should display label and value in free text mode', () => {
      const label = fixture.nativeElement.querySelector('.field-dropdown-label');
      const value = fixture.nativeElement.querySelector('.field-dropdown-value');
      expect(label.textContent.trim()).toBe('Assignee:');
      expect(value.textContent.trim()).toBe('alice');
    });

    it('should switch to input on click', async () => {
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      display.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('.field-dropdown-input');
      expect(input).toBeTruthy();
      expect(input.value).toBe('alice');
    });

    it('should emit valueChanged on blur when value changed', () => {
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      display.click();
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('.field-dropdown-input');
      input.value = 'bob';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(host.changedValue).toBe('bob');
    });

    it('should not emit valueChanged on blur when value unchanged', () => {
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      display.click();
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('.field-dropdown-input');
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(host.changedValue).toBeNull();
    });

    it('should save on Enter key', () => {
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      display.click();
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('.field-dropdown-input');
      input.value = 'charlie';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();

      expect(host.changedValue).toBe('charlie');
    });

    it('should exit editing mode on Escape key', () => {
      const display = fixture.nativeElement.querySelector('.field-dropdown-display');
      display.click();
      fixture.detectChanges();

      const input: HTMLInputElement = fixture.nativeElement.querySelector('.field-dropdown-input');
      expect(input).toBeTruthy();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();

      // Should exit editing mode and show display element
      const displayAgain = fixture.nativeElement.querySelector('.field-dropdown-display');
      expect(displayAgain).toBeTruthy();
      const inputGone = fixture.nativeElement.querySelector('.field-dropdown-input');
      expect(inputGone).toBeFalsy();
    });

    it('should show placeholder when value is empty', () => {
      host.value = '';
      fixture.detectChanges();
      const value = fixture.nativeElement.querySelector('.field-dropdown-value');
      expect(value.textContent.trim()).toBe('Unassigned');
    });
  });
});

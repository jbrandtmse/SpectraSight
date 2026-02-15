import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { InlineEditComponent } from './inline-edit.component';

@Component({
  standalone: true,
  imports: [InlineEditComponent],
  template: `
    <app-inline-edit
      [value]="value"
      [type]="type"
      [placeholder]="placeholder"
      [fieldClass]="fieldClass"
      (valueChanged)="onValueChanged($event)">
    </app-inline-edit>
  `,
})
class TestHostComponent {
  value = 'Test title';
  type: 'text' | 'textarea' = 'text';
  placeholder = 'Click to edit';
  fieldClass = '';
  changedValue: string | null = null;

  onValueChanged(val: string): void {
    this.changedValue = val;
  }
}

describe('InlineEditComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    const el = fixture.nativeElement.querySelector('app-inline-edit');
    expect(el).toBeTruthy();
  });

  it('should display value in non-editing mode', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(display).toBeTruthy();
    expect(display.textContent.trim()).toBe('Test title');
  });

  it('should display placeholder when value is empty', () => {
    host.value = '';
    fixture.detectChanges();
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(display.textContent.trim()).toBe('Click to edit');
  });

  it('should have role="textbox" on display element', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(display.getAttribute('role')).toBe('textbox');
  });

  it('should have tabindex="0" on display element', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(display.getAttribute('tabindex')).toBe('0');
  });

  it('should switch to input on click', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.inline-edit-input');
    expect(input).toBeTruthy();
    expect(input.tagName.toLowerCase()).toBe('input');
  });

  it('should switch to textarea when type is textarea', () => {
    host.type = 'textarea';
    fixture.detectChanges();

    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector('.inline-edit-textarea');
    expect(textarea).toBeTruthy();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('should populate input with current value on edit start', async () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.inline-edit-input');
    expect(input.value).toBe('Test title');
  });

  it('should emit valueChanged on blur when value changed', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.inline-edit-input');
    input.value = 'New title';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.changedValue).toBe('New title');
  });

  it('should not emit valueChanged on blur when value unchanged', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.inline-edit-input');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.changedValue).toBeNull();
  });

  it('should save on Enter for text type', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.inline-edit-input');
    input.value = 'Enter saved';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(host.changedValue).toBe('Enter saved');
    // Should exit editing mode
    const displayAgain = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(displayAgain).toBeTruthy();
  });

  it('should exit editing mode on Escape', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('.inline-edit-input');
    expect(input).toBeTruthy();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    // Should exit editing mode and show display element
    const displayAgain = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(displayAgain).toBeTruthy();
    const inputGone = fixture.nativeElement.querySelector('.inline-edit-input');
    expect(inputGone).toBeFalsy();
  });

  it('should not save on Enter for textarea type (requires Ctrl+Enter)', () => {
    host.type = 'textarea';
    fixture.detectChanges();

    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.inline-edit-textarea');
    textarea.value = 'Multiline text';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    // Should still be in editing mode (Enter is for new lines in textarea)
    const editingTextarea = fixture.nativeElement.querySelector('.inline-edit-textarea');
    expect(editingTextarea).toBeTruthy();
  });

  it('should save on Ctrl+Enter for textarea type', () => {
    host.type = 'textarea';
    fixture.detectChanges();

    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.click();
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('.inline-edit-textarea');
    textarea.value = 'Ctrl Enter save';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
    fixture.detectChanges();

    expect(host.changedValue).toBe('Ctrl Enter save');
  });

  it('should apply fieldClass to display element', () => {
    host.fieldClass = 'headline';
    fixture.detectChanges();
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    expect(display.classList.contains('headline')).toBeTrue();
  });

  it('should start edit on Enter keydown on display element', () => {
    const display = fixture.nativeElement.querySelector('.inline-edit-display');
    display.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.inline-edit-input');
    expect(input).toBeTruthy();
  });
});

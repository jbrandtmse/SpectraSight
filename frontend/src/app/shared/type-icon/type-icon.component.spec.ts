import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TypeIconComponent } from './type-icon.component';

@Component({
  standalone: true,
  imports: [TypeIconComponent],
  template: `<ss-type-icon [type]="type" [size]="size"></ss-type-icon>`,
})
class TestHostComponent {
  type: 'bug' | 'task' | 'story' | 'epic' = 'bug';
  size = 16;
}

describe('TypeIconComponent', () => {
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
    const icon = fixture.nativeElement.querySelector('ss-type-icon');
    expect(icon).toBeTruthy();
  });

  it('should render bug_report icon for bug type', () => {
    host.type = 'bug';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.textContent.trim()).toBe('bug_report');
  });

  it('should render check_box_outline_blank icon for task type', () => {
    host.type = 'task';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.textContent.trim()).toBe('check_box_outline_blank');
  });

  it('should render bookmark icon for story type', () => {
    host.type = 'story';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.textContent.trim()).toBe('bookmark');
  });

  it('should render bolt icon for epic type', () => {
    host.type = 'epic';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.textContent.trim()).toBe('bolt');
  });

  it('should use bug color variable for bug type', () => {
    host.type = 'bug';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.style.color).toBe('var(--ss-type-bug)');
  });

  it('should use task color variable for task type', () => {
    host.type = 'task';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.style.color).toBe('var(--ss-type-task)');
  });

  it('should use story color variable for story type', () => {
    host.type = 'story';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.style.color).toBe('var(--ss-type-story)');
  });

  it('should use epic color variable for epic type', () => {
    host.type = 'epic';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.style.color).toBe('var(--ss-type-epic)');
  });

  it('should set icon size via style binding', () => {
    host.size = 24;
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.style.fontSize).toBe('24px');
    expect(matIcon.style.width).toBe('24px');
    expect(matIcon.style.height).toBe('24px');
  });

  it('should set aria-label to the ticket type', () => {
    host.type = 'epic';
    fixture.detectChanges();
    const matIcon = fixture.nativeElement.querySelector('mat-icon');
    expect(matIcon.getAttribute('aria-label')).toBe('epic');
  });
});

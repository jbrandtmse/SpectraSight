import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { StatusBadgeComponent } from './status-badge.component';
import { TicketStatus } from '../../tickets/ticket.model';

@Component({
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `<ss-status-badge [status]="status" [compact]="compact"></ss-status-badge>`,
})
class TestHostComponent {
  status: TicketStatus = 'Open';
  compact = true;
}

describe('StatusBadgeComponent', () => {
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
    const badge = fixture.nativeElement.querySelector('ss-status-badge');
    expect(badge).toBeTruthy();
  });

  it('should display the status label text', () => {
    host.status = 'In Progress';
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.label');
    expect(label.textContent.trim()).toBe('In Progress');
  });

  it('should use Open color variable for Open status', () => {
    host.status = 'Open';
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.dot');
    expect(dot.style.backgroundColor).toBe('var(--ss-status-open)');
  });

  it('should use In Progress color variable', () => {
    host.status = 'In Progress';
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.dot');
    expect(dot.style.backgroundColor).toBe('var(--ss-status-in-progress)');
  });

  it('should use Blocked color variable', () => {
    host.status = 'Blocked';
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.dot');
    expect(dot.style.backgroundColor).toBe('var(--ss-status-blocked)');
  });

  it('should use Complete color variable', () => {
    host.status = 'Complete';
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.dot');
    expect(dot.style.backgroundColor).toBe('var(--ss-status-complete)');
  });

  it('should have compact class when compact is true', () => {
    host.compact = true;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.ss-status-badge');
    expect(badge.classList.contains('compact')).toBeTrue();
  });

  it('should not have compact class when compact is false', () => {
    host.compact = false;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.ss-status-badge');
    expect(badge.classList.contains('compact')).toBeFalse();
  });

  it('should have aria-label with status text', () => {
    host.status = 'Blocked';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.ss-status-badge');
    expect(badge.getAttribute('aria-label')).toBe('Status: Blocked');
  });
});

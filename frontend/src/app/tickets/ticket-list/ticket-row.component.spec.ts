import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TicketRowComponent } from './ticket-row.component';
import { Ticket } from '../ticket.model';

const MOCK_TICKET: Ticket = {
  id: '1',
  type: 'bug',
  title: 'Fix login button alignment',
  status: 'Open',
  priority: 'High',
  assignee: 'alice',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-15T10:00:00Z',
};

@Component({
  standalone: true,
  imports: [TicketRowComponent],
  template: `
    <app-ticket-row
      [ticket]="ticket"
      [selected]="selected"
      [focused]="focused"
      (ticketSelected)="onSelected($event)">
    </app-ticket-row>
  `,
})
class TestHostComponent {
  ticket: Ticket = MOCK_TICKET;
  selected = false;
  focused = false;
  selectedId: string | null = null;

  onSelected(id: string): void {
    this.selectedId = id;
  }
}

describe('TicketRowComponent', () => {
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

  it('should create', () => {
    const row = fixture.nativeElement.querySelector('.ticket-row');
    expect(row).toBeTruthy();
  });

  it('should render the ticket title', () => {
    const title = fixture.nativeElement.querySelector('.ticket-title');
    expect(title.textContent.trim()).toBe('Fix login button alignment');
  });

  it('should render the type icon component', () => {
    const icon = fixture.nativeElement.querySelector('ss-type-icon');
    expect(icon).toBeTruthy();
  });

  it('should render the status badge component', () => {
    const badge = fixture.nativeElement.querySelector('ss-status-badge');
    expect(badge).toBeTruthy();
  });

  it('should render the assignee', () => {
    const assignee = fixture.nativeElement.querySelector('.ticket-assignee');
    expect(assignee.textContent.trim()).toBe('alice');
  });

  it('should render the timestamp', () => {
    const timestamp = fixture.nativeElement.querySelector('.ticket-timestamp');
    expect(timestamp).toBeTruthy();
    expect(timestamp.textContent.trim()).not.toBe('');
  });

  it('should have 36px row height', () => {
    const row = fixture.nativeElement.querySelector('.ticket-row');
    expect(row.offsetHeight).toBe(36);
  });

  it('should add selected class when selected input is true', () => {
    host.selected = true;
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('.ticket-row');
    expect(row.classList.contains('selected')).toBeTrue();
  });

  it('should not have selected class by default', () => {
    const row = fixture.nativeElement.querySelector('.ticket-row');
    expect(row.classList.contains('selected')).toBeFalse();
  });

  it('should add focused class when focused input is true', () => {
    host.focused = true;
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('.ticket-row');
    expect(row.classList.contains('focused')).toBeTrue();
  });

  it('should emit ticketSelected with ticket id on click', () => {
    const row = fixture.nativeElement.querySelector('.ticket-row');
    row.click();
    expect(host.selectedId).toBe('1');
  });

  it('should have role="option" for accessibility', () => {
    const row = fixture.nativeElement.querySelector('.ticket-row');
    expect(row.getAttribute('role')).toBe('option');
  });

  it('should set aria-selected based on selected state', () => {
    const row = fixture.nativeElement.querySelector('.ticket-row');
    expect(row.getAttribute('aria-selected')).toBe('false');
    host.selected = true;
    fixture.detectChanges();
    expect(row.getAttribute('aria-selected')).toBe('true');
  });

  it('should render empty string when assignee is undefined', () => {
    host.ticket = { ...MOCK_TICKET, assignee: undefined };
    fixture.detectChanges();
    const assignee = fixture.nativeElement.querySelector('.ticket-assignee');
    expect(assignee.textContent.trim()).toBe('');
  });
});

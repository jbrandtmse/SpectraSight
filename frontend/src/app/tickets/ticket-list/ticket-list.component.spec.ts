import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TicketListComponent } from './ticket-list.component';
import { TicketService } from '../ticket.service';
import { Ticket } from '../ticket.model';
import { ApiListResponse } from '../../shared/models/api-response.model';

const MOCK_TICKETS: Ticket[] = [
  { id: '1', type: 'bug', title: 'Bug 1', status: 'Open', priority: 'High', assignee: 'alice', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z' },
  { id: '2', type: 'task', title: 'Task 1', status: 'In Progress', priority: 'Medium', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-02-14T10:00:00Z' },
  { id: '3', type: 'story', title: 'Story 1', status: 'Complete', priority: 'Low', assignee: 'bob', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-02-13T10:00:00Z' },
];

describe('TicketListComponent', () => {
  let component: TicketListComponent;
  let fixture: ComponentFixture<TicketListComponent>;
  let httpMock: HttpTestingController;
  let ticketService: TicketService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    ticketService = TestBed.inject(TicketService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushTickets(tickets: Ticket[] = MOCK_TICKETS): void {
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({
      data: tickets,
      total: tickets.length,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    } as ApiListResponse<Ticket>);
  }

  it('should create', () => {
    fixture.detectChanges();
    flushTickets();
    expect(component).toBeTruthy();
  });

  it('should call loadTickets on init', () => {
    spyOn(ticketService, 'loadTickets').and.callThrough();
    fixture.detectChanges();
    flushTickets();
    expect(ticketService.loadTickets).toHaveBeenCalled();
  });

  it('should show skeleton rows while loading', () => {
    fixture.detectChanges();
    // Don't flush yet -- loading is true
    const skeletonRows = fixture.nativeElement.querySelectorAll('.skeleton-row');
    expect(skeletonRows.length).toBe(8);
    flushTickets();
  });

  it('should show empty state when no tickets', () => {
    fixture.detectChanges();
    flushTickets([]);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No tickets yet');
    const button = emptyState.querySelector('button');
    expect(button.textContent.trim()).toContain('New Ticket');
  });

  it('should render ticket rows after loading', () => {
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('app-ticket-row');
    expect(rows.length).toBe(3);
  });

  it('should have listbox role on ticket list container', () => {
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.ticket-list');
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.getAttribute('aria-label')).toBe('Tickets');
  });

  it('should start with focusedIndex 0', () => {
    expect(component.focusedIndex()).toBe(0);
    fixture.detectChanges();
    flushTickets();
  });

  it('should navigate focusedIndex down on ArrowDown', () => {
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.focusedIndex()).toBe(1);
  });

  it('should not go past last ticket on ArrowDown', () => {
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    component.focusedIndex.set(2);
    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.focusedIndex()).toBe(2);
  });

  it('should navigate focusedIndex up on ArrowUp', () => {
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    component.focusedIndex.set(2);
    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.focusedIndex()).toBe(1);
  });

  it('should not go below 0 on ArrowUp', () => {
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.focusedIndex()).toBe(0);
  });

  it('should select focused ticket and navigate on Enter', () => {
    const navigateSpy = spyOn(router, 'navigate');
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    component.focusedIndex.set(1);
    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(ticketService.selectedTicketId()).toBe('2');
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', '2']);
  });

  it('should deselect ticket on Escape', () => {
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    ticketService.selectTicket('1');
    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(ticketService.selectedTicketId()).toBeNull();
  });

  it('should ignore keyboard events when no tickets', () => {
    fixture.detectChanges();
    flushTickets([]);
    fixture.detectChanges();

    // No list container rendered in empty state
    expect(component.focusedIndex()).toBe(0);
  });

  it('should select ticket and update focusedIndex on onTicketSelected', () => {
    const navigateSpy = spyOn(router, 'navigate');
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    component.onTicketSelected('3');
    expect(ticketService.selectedTicketId()).toBe('3');
    expect(component.focusedIndex()).toBe(2);
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', '3']);
  });

  it('should have tabindex on the ticket list for keyboard focus', () => {
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.ticket-list');
    expect(list.getAttribute('tabindex')).toBe('0');
  });

  // Story 1.6: newTicketRequested output
  it('should emit newTicketRequested on onNewTicket()', () => {
    let emitted = false;
    component.newTicketRequested.subscribe(() => emitted = true);
    fixture.detectChanges();
    flushTickets();
    fixture.detectChanges();

    component.onNewTicket();
    expect(emitted).toBeTrue();
  });

  it('should emit newTicketRequested when empty state New Ticket button is clicked', () => {
    let emitted = false;
    component.newTicketRequested.subscribe(() => emitted = true);
    fixture.detectChanges();
    flushTickets([]);
    fixture.detectChanges();

    const newBtn = fixture.nativeElement.querySelector('.empty-state button');
    newBtn.click();
    expect(emitted).toBeTrue();
  });
});

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

  /** Load tickets via the service (simulating what the parent page does). */
  function loadAndFlush(tickets: Ticket[] = MOCK_TICKETS): void {
    ticketService.loadTickets();
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
    expect(component).toBeTruthy();
  });

  it('should not call loadTickets on init (parent page orchestrates loading)', () => {
    spyOn(ticketService, 'loadTickets');
    fixture.detectChanges();
    expect(ticketService.loadTickets).not.toHaveBeenCalled();
  });

  it('should show skeleton rows while loading', () => {
    ticketService.loadTickets();
    fixture.detectChanges();
    const skeletonRows = fixture.nativeElement.querySelectorAll('.skeleton-row');
    expect(skeletonRows.length).toBe(8);

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  it('should show empty state when no tickets', () => {
    loadAndFlush([]);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No tickets yet');
    const button = emptyState.querySelector('button');
    expect(button.textContent.trim()).toContain('New Ticket');
  });

  it('should render ticket rows after loading', () => {
    loadAndFlush();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('app-ticket-row');
    expect(rows.length).toBe(3);
  });

  it('should have listbox role on ticket list container', () => {
    loadAndFlush();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.ticket-list');
    expect(list.getAttribute('role')).toBe('listbox');
    expect(list.getAttribute('aria-label')).toBe('Tickets');
  });

  it('should start with focusedIndex 0', () => {
    expect(component.focusedIndex()).toBe(0);
  });

  it('should navigate focusedIndex down on ArrowDown', () => {
    loadAndFlush();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.focusedIndex()).toBe(1);
  });

  it('should not go past last ticket on ArrowDown', () => {
    loadAndFlush();
    fixture.detectChanges();

    component.focusedIndex.set(2);
    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.focusedIndex()).toBe(2);
  });

  it('should navigate focusedIndex up on ArrowUp', () => {
    loadAndFlush();
    fixture.detectChanges();

    component.focusedIndex.set(2);
    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.focusedIndex()).toBe(1);
  });

  it('should not go below 0 on ArrowUp', () => {
    loadAndFlush();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.focusedIndex()).toBe(0);
  });

  it('should select focused ticket and navigate on Enter', () => {
    const navigateSpy = spyOn(router, 'navigate');
    loadAndFlush();
    fixture.detectChanges();

    component.focusedIndex.set(1);
    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(ticketService.selectedTicketId()).toBe('2');
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', '2']);
  });

  it('should deselect ticket on Escape', () => {
    loadAndFlush();
    fixture.detectChanges();

    ticketService.selectTicket('1');
    const list = fixture.nativeElement.querySelector('.ticket-list');
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(ticketService.selectedTicketId()).toBeNull();
  });

  it('should ignore keyboard events when no tickets', () => {
    loadAndFlush([]);
    fixture.detectChanges();

    // No list container rendered in empty state
    expect(component.focusedIndex()).toBe(0);
  });

  it('should select ticket and update focusedIndex on onTicketSelected', () => {
    const navigateSpy = spyOn(router, 'navigate');
    loadAndFlush();
    fixture.detectChanges();

    component.onTicketSelected('3');
    expect(ticketService.selectedTicketId()).toBe('3');
    expect(component.focusedIndex()).toBe(2);
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', '3']);
  });

  it('should have tabindex on the ticket list for keyboard focus', () => {
    loadAndFlush();
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.ticket-list');
    expect(list.getAttribute('tabindex')).toBe('0');
  });

  // Story 1.6: newTicketRequested output
  it('should emit newTicketRequested on onNewTicket()', () => {
    let emitted = false;
    component.newTicketRequested.subscribe(() => emitted = true);
    loadAndFlush();
    fixture.detectChanges();

    component.onNewTicket();
    expect(emitted).toBeTrue();
  });

  it('should emit newTicketRequested when empty state New Ticket button is clicked', () => {
    let emitted = false;
    component.newTicketRequested.subscribe(() => emitted = true);
    loadAndFlush([]);
    fixture.detectChanges();

    const newBtn = fixture.nativeElement.querySelector('.empty-state button');
    newBtn.click();
    expect(emitted).toBeTrue();
  });

  // Story 2.2: Column headers
  it('should render column headers when tickets are present', () => {
    loadAndFlush();
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelector('.column-headers');
    expect(headers).toBeTruthy();
    const buttons = headers.querySelectorAll('button.col-header');
    expect(buttons.length).toBe(5); // Title, Status, Priority, Assignee, Updated
  });

  it('should not render column headers when no tickets', () => {
    loadAndFlush([]);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelector('.column-headers');
    expect(headers).toBeFalsy();
  });

  // Story 2.2: Sort functionality (onSortColumn emits sortChanged)
  it('should emit sortChanged on column header click', () => {
    let emittedSort = '';
    component.sortChanged.subscribe((s: string) => emittedSort = s);
    loadAndFlush();
    fixture.detectChanges();

    component.onSortColumn('title');
    expect(emittedSort).toBe('title');
  });

  it('should toggle sort direction when clicking same column', () => {
    let emittedSort = '';
    component.sortChanged.subscribe((s: string) => emittedSort = s);
    loadAndFlush();
    fixture.detectChanges();

    // Default sort is -updatedAt, clicking updatedAt should toggle to ascending
    component.onSortColumn('updatedAt');
    expect(emittedSort).toBe('updatedAt');
  });

  it('should compute sortField and sortDirection from filterState', () => {
    fixture.detectChanges();

    // Default sort is -updatedAt
    expect(component.sortField()).toBe('updatedAt');
    expect(component.sortDirection()).toBe('desc');
  });

  // Story 2.2: Filtered empty state (AC #10)
  it('should show filtered empty state when tickets empty with active filters', () => {
    ticketService.setFilters({ type: ['bug'] });
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
    fixture.detectChanges();

    const filteredEmpty = fixture.nativeElement.querySelector('.empty-state--filtered');
    expect(filteredEmpty).toBeTruthy();
    expect(filteredEmpty.textContent).toContain('No tickets match your filters');

    const clearBtn = filteredEmpty.querySelector('button');
    expect(clearBtn.textContent.trim()).toContain('Clear filters');
  });

  it('should call setFilters({}) on Clear filters click', () => {
    const setFiltersSpy = spyOn(ticketService, 'setFilters');
    component.onClearFilters();
    expect(setFiltersSpy).toHaveBeenCalledWith({});
  });

  // Story 6.5: isAllClosedHidden computed and all-closed empty state (AC #7)
  it('should show all-closed empty state when tickets empty, includeClosed off, no filters, closedCount > 0', () => {
    // Set no filters (default state, includeClosed is false)
    ticketService.setFilters({});
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 0,
      closedCount: 3,
    } as ApiListResponse<Ticket>);
    fixture.detectChanges();

    expect(component.isAllClosedHidden()).toBeTrue();

    const allClosed = fixture.nativeElement.querySelector('.empty-state--all-closed');
    expect(allClosed).toBeTruthy();
    expect(allClosed.textContent).toContain("All tickets are closed. Toggle 'Show Closed' to view them.");
  });

  it('should not show all-closed state when closedCount is 0', () => {
    ticketService.setFilters({});
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 0,
      closedCount: 0,
    } as ApiListResponse<Ticket>);
    fixture.detectChanges();

    expect(component.isAllClosedHidden()).toBeFalse();

    const allClosed = fixture.nativeElement.querySelector('.empty-state--all-closed');
    expect(allClosed).toBeFalsy();
  });

  it('should not show all-closed state when includeClosed is true', () => {
    ticketService.setFilters({ includeClosed: true });
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 0,
      closedCount: 3,
    } as ApiListResponse<Ticket>);
    fixture.detectChanges();

    expect(component.isAllClosedHidden()).toBeFalse();
  });

  it('should not show all-closed state when active filters are set', () => {
    ticketService.setFilters({ type: ['bug'] });
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 0,
      closedCount: 3,
    } as ApiListResponse<Ticket>);
    fixture.detectChanges();

    expect(component.isAllClosedHidden()).toBeFalse();

    // Should show filtered empty state instead
    const filteredEmpty = fixture.nativeElement.querySelector('.empty-state--filtered');
    expect(filteredEmpty).toBeTruthy();
  });

  it('should not show all-closed state when tickets exist', () => {
    ticketService.setFilters({});
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({
      data: MOCK_TICKETS,
      total: 3,
      page: 1,
      pageSize: 100,
      totalPages: 1,
      closedCount: 1,
    } as ApiListResponse<Ticket>);
    fixture.detectChanges();

    expect(component.isAllClosedHidden()).toBeFalse();
  });

  it('should not show all-closed state when project filter is active', () => {
    ticketService.setFilters({ project: 'SS' });
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 0,
      closedCount: 3,
    } as ApiListResponse<Ticket>);
    fixture.detectChanges();

    expect(component.isAllClosedHidden()).toBeFalse();
  });
});

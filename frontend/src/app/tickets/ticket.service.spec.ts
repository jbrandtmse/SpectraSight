import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TicketService } from './ticket.service';
import { Ticket, FilterState } from './ticket.model';
import { ApiListResponse, ApiResponse } from '../shared/models/api-response.model';

const MOCK_TICKETS: Ticket[] = [
  { id: '1', type: 'bug', title: 'Bug 1', status: 'Open', priority: 'High', assignee: 'alice', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z' },
  { id: '2', type: 'task', title: 'Task 1', status: 'In Progress', priority: 'Medium', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-02-14T10:00:00Z' },
  { id: '3', type: 'story', title: 'Story 1', status: 'Complete', priority: 'Low', assignee: 'bob', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-02-13T10:00:00Z' },
];

describe('TicketService', () => {
  let service: TicketService;
  let httpMock: HttpTestingController;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    });
    service = TestBed.inject(TicketService);
    httpMock = TestBed.inject(HttpTestingController);
    snackBar = TestBed.inject(MatSnackBar);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty tickets and loading false', () => {
    expect(service.tickets()).toEqual([]);
    expect(service.loading()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.selectedTicketId()).toBeNull();
    expect(service.selectedTicket()).toBeNull();
  });

  it('should set loading to true then false on loadTickets success', () => {
    service.loadTickets();
    expect(service.loading()).toBeTrue();

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.get('sort')).toBe('-updatedAt');
    expect(req.request.params.get('pageSize')).toBe('100');

    req.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 } as ApiListResponse<Ticket>);

    expect(service.loading()).toBeFalse();
    expect(service.tickets().length).toBe(3);
  });

  it('should set error on loadTickets failure', () => {
    service.loadTickets();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush(
      { error: { code: 'INTERNAL_ERROR', message: 'Server error', status: 500 } },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(service.loading()).toBeFalse();
    expect(service.error()).toBe('Server error');
  });

  it('should set generic error when no message in error response', () => {
    service.loadTickets();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(service.error()).toBe('Failed to load tickets');
  });

  it('should select a ticket and compute selectedTicket', () => {
    service.loadTickets();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    service.selectTicket('2');
    expect(service.selectedTicketId()).toBe('2');
    expect(service.selectedTicket()?.title).toBe('Task 1');
  });

  it('should return null for selectedTicket when id does not match', () => {
    service.loadTickets();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    service.selectTicket('999');
    expect(service.selectedTicket()).toBeNull();
  });

  it('should deselect ticket when selectTicket(null)', () => {
    service.selectTicket('1');
    expect(service.selectedTicketId()).toBe('1');
    service.selectTicket(null);
    expect(service.selectedTicketId()).toBeNull();
  });

  it('should getTicket by id via HTTP', () => {
    const mockTicket = MOCK_TICKETS[0];
    let result: Ticket | null = null;
    service.getTicket('1').subscribe(t => result = t);

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets/1'));
    req.flush({ data: mockTicket } as ApiResponse<Ticket>);

    expect(result).toBeTruthy();
    expect(result!.id).toBe('1');
  });

  it('should optimistically update ticket then replace with server response', () => {
    // Load tickets first
    service.loadTickets();
    const loadReq = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    loadReq.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    // Update ticket
    service.updateTicket('1', { title: 'Updated Bug' });

    // Optimistic update should be reflected immediately
    expect(service.tickets().find(t => t.id === '1')?.title).toBe('Updated Bug');

    // Server responds
    const putReq = httpMock.expectOne(r => r.url.includes('/api/tickets/1') && r.method === 'PUT');
    const serverTicket = { ...MOCK_TICKETS[0], title: 'Updated Bug (server)' };
    putReq.flush({ data: serverTicket } as ApiResponse<Ticket>);

    expect(service.tickets().find(t => t.id === '1')?.title).toBe('Updated Bug (server)');
  });

  it('should revert optimistic update on server error', () => {
    service.loadTickets();
    const loadReq = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    loadReq.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    service.updateTicket('1', { title: 'Fail Update' });
    expect(service.tickets().find(t => t.id === '1')?.title).toBe('Fail Update');

    const putReq = httpMock.expectOne(r => r.url.includes('/api/tickets/1') && r.method === 'PUT');
    putReq.flush(
      { error: { message: 'Validation failed' } },
      { status: 400, statusText: 'Bad Request' }
    );

    // Should revert to original
    expect(service.tickets().find(t => t.id === '1')?.title).toBe('Bug 1');
  });

  it('should not update if ticket id is not found', () => {
    service.loadTickets();
    const loadReq = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    loadReq.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    const ticketsBefore = service.tickets();
    service.updateTicket('nonexistent', { title: 'Nothing' });
    // No PUT request should be made
    httpMock.expectNone(r => r.method === 'PUT');
    // Tickets should remain unchanged
    expect(service.tickets()).toEqual(ticketsBefore);
  });

  it('should updateTicketField as a convenience wrapper', () => {
    service.loadTickets();
    const loadReq = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    loadReq.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    service.updateTicketField('1', 'status', 'Complete');
    expect(service.tickets().find(t => t.id === '1')?.status).toBe('Complete');

    const putReq = httpMock.expectOne(r => r.url.includes('/api/tickets/1') && r.method === 'PUT');
    putReq.flush({ data: { ...MOCK_TICKETS[0], status: 'Complete' } });
  });

  it('should refreshTickets by calling loadTickets again', () => {
    service.refreshTickets();
    expect(service.loading()).toBeTrue();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  // createTicket tests
  it('should POST to /api/tickets and prepend new ticket to ticketsSignal', () => {
    // Load initial tickets
    service.loadTickets();
    const loadReq = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    loadReq.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    const createdTicket: Ticket = {
      id: 'SS-10', type: 'bug', title: 'New bug', status: 'Open',
      priority: 'High', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z',
    };

    let result: Ticket | null = null;
    service.createTicket({ type: 'bug', title: 'New bug' }).subscribe(t => result = t);

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'POST');
    expect(req.request.body).toEqual({ type: 'bug', title: 'New bug' });
    req.flush({ data: createdTicket } as ApiResponse<Ticket>);

    expect(result).toBeTruthy();
    expect(result!.id).toBe('SS-10');
    expect(service.tickets()[0].id).toBe('SS-10');
    expect(service.tickets().length).toBe(4);
    expect(service.selectedTicketId()).toBe('SS-10');
  });

  it('should show snackbar on successful create', () => {
    const snackSpy = spyOn(snackBar, 'open');
    service.createTicket({ type: 'task', title: 'Test' }).subscribe();

    const req = httpMock.expectOne(r => r.method === 'POST');
    req.flush({ data: { ...MOCK_TICKETS[0], id: 'SS-99', type: 'task', title: 'Test' } });

    expect(snackSpy).toHaveBeenCalledWith('Ticket SS-99 created', '', { duration: 3000 });
  });

  // deleteTicket tests
  it('should DELETE ticket and remove from ticketsSignal', () => {
    service.loadTickets();
    const loadReq = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    loadReq.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    service.selectTicket('1');
    expect(service.selectedTicketId()).toBe('1');

    service.deleteTicket('1');

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets/1') && r.method === 'DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.tickets().length).toBe(2);
    expect(service.tickets().find(t => t.id === '1')).toBeUndefined();
    expect(service.selectedTicketId()).toBeNull();
  });

  it('should show snackbar on successful delete', () => {
    service.loadTickets();
    const loadReq = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    loadReq.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    const snackSpy = spyOn(snackBar, 'open');
    service.deleteTicket('2');

    const req = httpMock.expectOne(r => r.method === 'DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(snackSpy).toHaveBeenCalledWith('Ticket deleted', '', { duration: 3000 });
  });

  it('should show error snackbar on delete failure', () => {
    service.loadTickets();
    const loadReq = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    loadReq.flush({ data: MOCK_TICKETS, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    const snackSpy = spyOn(snackBar, 'open');
    service.deleteTicket('1');

    const req = httpMock.expectOne(r => r.method === 'DELETE');
    req.flush(
      { error: { code: 'NOT_FOUND', message: 'Ticket not found', status: 404 } },
      { status: 404, statusText: 'Not Found' }
    );

    expect(snackSpy).toHaveBeenCalledWith('Ticket not found', 'Dismiss', jasmine.objectContaining({ duration: 0 }));
    // Tickets should NOT have been modified on error
    expect(service.tickets().length).toBe(3);
  });

  // Story 2.2: Filter state and setFilters
  it('should start with empty filterState', () => {
    expect(service.filterState()).toEqual({});
  });

  it('should update filterState and reload on setFilters', () => {
    const filters: FilterState = { type: ['bug'], status: ['Open'] };
    service.setFilters(filters);

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'GET');
    expect(req.request.params.get('type')).toBe('bug');
    expect(req.request.params.get('status')).toBe('Open');
    expect(req.request.params.get('sort')).toBe('-updatedAt');
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });

    expect(service.filterState()).toEqual(filters);
  });

  it('should pass sort parameter from filter state', () => {
    service.setFilters({ sort: '-title' });

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.get('sort')).toBe('-title');
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  it('should pass search parameter from filter state', () => {
    service.setFilters({ search: 'validation' });

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.get('search')).toBe('validation');
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  it('should pass multi-value type as comma-separated', () => {
    service.setFilters({ type: ['bug', 'task'] });

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.get('type')).toBe('bug,task');
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  it('should pass priority and assignee parameters', () => {
    service.setFilters({ priority: 'High', assignee: 'alice' });

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.get('priority')).toBe('High');
    expect(req.request.params.get('assignee')).toBe('alice');
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  // Story 5.4: Project filter parameter
  it('should pass project parameter from filter state', () => {
    service.setFilters({ project: 'DATA' });

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.get('project')).toBe('DATA');
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  it('should not include project param when not set', () => {
    service.setFilters({ type: ['bug'] });

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.has('project')).toBeFalse();
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  it('should not include empty filter params in request', () => {
    service.setFilters({});

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.has('type')).toBeFalse();
    expect(req.request.params.has('status')).toBeFalse();
    expect(req.request.params.has('search')).toBeFalse();
    expect(req.request.params.has('priority')).toBeFalse();
    expect(req.request.params.has('assignee')).toBeFalse();
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  });

  it('should debounce search via setSearch', fakeAsync(() => {
    service.setSearch('test');

    // No request yet (debounce pending)
    httpMock.expectNone(r => r.url.includes('/api/tickets'));

    tick(300);

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.params.get('search')).toBe('test');
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  }));

  it('should clear search when setSearch receives empty string', fakeAsync(() => {
    // First set a search
    service.setFilters({ search: 'old' });
    const req1 = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req1.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });

    // Then clear via setSearch
    service.setSearch('');
    tick(300);

    const req2 = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req2.request.params.has('search')).toBeFalse();
    req2.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
  }));
});

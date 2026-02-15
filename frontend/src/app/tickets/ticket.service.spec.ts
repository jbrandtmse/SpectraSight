import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TicketService } from './ticket.service';
import { Ticket } from './ticket.model';
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

    service.updateTicket('nonexistent', { title: 'Nothing' });
    // No PUT request should be made
    httpMock.expectNone(r => r.method === 'PUT');
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
});

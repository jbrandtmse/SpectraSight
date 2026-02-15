import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Subject } from 'rxjs';
import { convertToParamMap, ParamMap } from '@angular/router';
import { TicketsPageComponent } from './tickets-page.component';
import { TicketService } from './ticket.service';

describe('TicketsPageComponent', () => {
  let component: TicketsPageComponent;
  let fixture: ComponentFixture<TicketsPageComponent>;
  let ticketService: TicketService;
  let httpMock: HttpTestingController;
  let paramMapSubject: Subject<ParamMap>;

  beforeEach(async () => {
    paramMapSubject = new Subject<ParamMap>();

    await TestBed.configureTestingModule({
      imports: [TicketsPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
            snapshot: { paramMap: convertToParamMap({}) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketsPageComponent);
    component = fixture.componentInstance;
    ticketService = TestBed.inject(TicketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    // Flush the loadTickets call from the child TicketListComponent
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
    expect(component).toBeTruthy();
  });

  it('should select ticket from route param on init', () => {
    const selectSpy = spyOn(ticketService, 'selectTicket');
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });

    paramMapSubject.next(convertToParamMap({ id: '42' }));
    expect(selectSpy).toHaveBeenCalledWith('42');
  });

  it('should not call selectTicket when no id in route params', () => {
    const selectSpy = spyOn(ticketService, 'selectTicket');
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });

    paramMapSubject.next(convertToParamMap({}));
    expect(selectSpy).not.toHaveBeenCalled();
  });

  it('should contain the split panel', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
    fixture.detectChanges();

    const splitPanel = fixture.nativeElement.querySelector('ss-split-panel');
    expect(splitPanel).toBeTruthy();
  });

  it('should contain the ticket list in the split panel', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
    fixture.detectChanges();

    const ticketList = fixture.nativeElement.querySelector('app-ticket-list');
    expect(ticketList).toBeTruthy();
  });

  it('should show placeholder when no ticket selected', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
    fixture.detectChanges();

    const placeholder = fixture.nativeElement.querySelector('.muted');
    expect(placeholder).toBeTruthy();
    expect(placeholder.textContent).toContain('Select a ticket from the list');
  });

  it('should show ticket-detail when a ticket is selected', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({
      data: [{ id: 'SS-1', type: 'bug', title: 'Test', status: 'Open', priority: 'High', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }],
      total: 1, page: 1, pageSize: 100, totalPages: 1,
    });

    ticketService.selectTicket('SS-1');
    fixture.detectChanges();

    const detail = fixture.nativeElement.querySelector('app-ticket-detail');
    expect(detail).toBeTruthy();
    const placeholder = fixture.nativeElement.querySelector('.detail-placeholder');
    expect(placeholder).toBeFalsy();
  });
});

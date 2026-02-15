import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TicketCreateComponent } from './ticket-create.component';
import { TicketService } from '../ticket.service';
import { Ticket } from '../ticket.model';
import { ApiResponse } from '../../shared/models/api-response.model';

const MOCK_CREATED_TICKET: Ticket = {
  id: 'SS-10',
  type: 'bug',
  title: 'New bug',
  status: 'Open',
  priority: 'High',
  createdAt: '2026-02-15T12:00:00Z',
  updatedAt: '2026-02-15T12:00:00Z',
};

describe('TicketCreateComponent', () => {
  let component: TicketCreateComponent;
  let fixture: ComponentFixture<TicketCreateComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketCreateComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketCreateComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a form with title, type, status, priority, assignee, description controls', () => {
    expect(component.form.contains('title')).toBeTrue();
    expect(component.form.contains('type')).toBeTrue();
    expect(component.form.contains('status')).toBeTrue();
    expect(component.form.contains('priority')).toBeTrue();
    expect(component.form.contains('assignee')).toBeTrue();
    expect(component.form.contains('description')).toBeTrue();
  });

  it('should have title as required', () => {
    component.form.controls.title.setValue('');
    expect(component.form.controls.title.hasError('required')).toBeTrue();
  });

  it('should have type as required', () => {
    component.form.controls.type.setValue('');
    expect(component.form.controls.type.hasError('required')).toBeTrue();
  });

  it('should default status to "Open"', () => {
    expect(component.form.controls.status.value).toBe('Open');
  });

  it('should render New Ticket header', () => {
    const header = fixture.nativeElement.querySelector('.create-title');
    expect(header.textContent.trim()).toBe('New Ticket');
  });

  it('should render title input', () => {
    const input = fixture.nativeElement.querySelector('input[formControlName="title"]');
    expect(input).toBeTruthy();
  });

  it('should render type select', () => {
    const select = fixture.nativeElement.querySelector('mat-select[formControlName="type"]');
    expect(select).toBeTruthy();
  });

  it('should render Create and Cancel buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.create-actions button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent.trim()).toContain('Cancel');
    expect(buttons[1].textContent.trim()).toContain('Create');
  });

  it('should disable Create button when form is invalid', () => {
    const createBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(createBtn.disabled).toBeTrue();
  });

  it('should enable Create button when form is valid', () => {
    component.form.controls.title.setValue('Test ticket');
    component.form.controls.type.setValue('bug');
    fixture.detectChanges();
    const createBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(createBtn.disabled).toBeFalse();
  });

  // AC #5: Show validation error when title is empty on submit
  it('should show validation error for empty title on submit attempt', () => {
    component.form.controls.type.setValue('bug');
    component.onSubmit();
    fixture.detectChanges();

    expect(component.form.controls.title.touched).toBeTrue();
    const error = fixture.nativeElement.querySelector('mat-error');
    expect(error).toBeTruthy();
    expect(error.textContent).toContain('Title is required');
  });

  it('should not submit when form is invalid', () => {
    component.onSubmit();
    httpMock.expectNone(r => r.method === 'POST');
  });

  // AC #3: Successful creation
  it('should call createTicket and emit created on success', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');
    let createdEmitted = false;
    component.created.subscribe(() => createdEmitted = true);

    component.form.controls.title.setValue('New bug');
    component.form.controls.type.setValue('bug');
    component.onSubmit();

    expect(component.submitting()).toBeTrue();

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets') && r.method === 'POST');
    expect(req.request.body.title).toBe('New bug');
    expect(req.request.body.type).toBe('bug');

    req.flush({ data: MOCK_CREATED_TICKET } as ApiResponse<Ticket>);
    tick();

    expect(component.submitting()).toBeFalse();
    expect(createdEmitted).toBeTrue();
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', 'SS-10']);

    tick(3000); // flush snackbar timer
  }));

  it('should set submitting to false on error', fakeAsync(() => {
    component.form.controls.title.setValue('Fail ticket');
    component.form.controls.type.setValue('task');
    component.onSubmit();

    expect(component.submitting()).toBeTrue();

    const req = httpMock.expectOne(r => r.method === 'POST');
    req.flush({ error: { message: 'Server error' } }, { status: 500, statusText: 'Error' });
    tick();

    expect(component.submitting()).toBeFalse();
  }));

  it('should emit cancelled on cancel', () => {
    let cancelledEmitted = false;
    component.cancelled.subscribe(() => cancelledEmitted = true);
    component.onCancel();
    expect(cancelledEmitted).toBeTrue();
  });

  it('should emit cancelled on close button click', () => {
    let cancelledEmitted = false;
    component.cancelled.subscribe(() => cancelledEmitted = true);

    const closeBtn = fixture.nativeElement.querySelector('button[aria-label="Close creation form"]');
    closeBtn.click();

    expect(cancelledEmitted).toBeTrue();
  });

  it('should not include optional fields in request when empty', fakeAsync(() => {
    spyOn(router, 'navigate');
    component.form.controls.title.setValue('Minimal');
    component.form.controls.type.setValue('task');
    component.onSubmit();

    const req = httpMock.expectOne(r => r.method === 'POST');
    expect(req.request.body.description).toBeUndefined();
    expect(req.request.body.priority).toBeUndefined();
    expect(req.request.body.assignee).toBeUndefined();
    // Status default 'Open' should not be sent either
    expect(req.request.body.status).toBeUndefined();

    req.flush({ data: { ...MOCK_CREATED_TICKET, type: 'task', title: 'Minimal' } });
    tick(3000); // flush snackbar timer
  }));

  it('should include optional fields in request when filled', fakeAsync(() => {
    spyOn(router, 'navigate');
    component.form.controls.title.setValue('Full ticket');
    component.form.controls.type.setValue('story');
    component.form.controls.priority.setValue('High');
    component.form.controls.assignee.setValue('alice');
    component.form.controls.description.setValue('A description');
    component.form.controls.status.setValue('In Progress');
    component.onSubmit();

    const req = httpMock.expectOne(r => r.method === 'POST');
    expect(req.request.body.priority).toBe('High');
    expect(req.request.body.assignee).toBe('alice');
    expect(req.request.body.description).toBe('A description');
    expect(req.request.body.status).toBe('In Progress');

    req.flush({ data: { ...MOCK_CREATED_TICKET, type: 'story', title: 'Full ticket' } });
    tick(3000); // flush snackbar timer
  }));
});

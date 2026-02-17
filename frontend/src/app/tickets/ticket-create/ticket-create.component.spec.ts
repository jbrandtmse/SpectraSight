import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TicketCreateComponent } from './ticket-create.component';
import { TicketService } from '../ticket.service';
import { UserMappingService } from '../../core/settings/users/user-mapping.service';
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
    // Flush any pending /api/users request from UserMappingService.ensureLoaded()
    const userReqs = httpMock.match(r => r.url.includes('/api/users'));
    userReqs.forEach(r => r.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }));
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

  // Story 2.1: Parent autocomplete tests (AC #10)
  it('should have a parentSearch form control', () => {
    expect(component.form.contains('parentSearch')).toBeTrue();
  });

  it('should render parent autocomplete input', () => {
    const input = fixture.nativeElement.querySelector('input[formControlName="parentSearch"]');
    expect(input).toBeTruthy();
  });

  it('should start with no parent selected', () => {
    expect(component.selectedParent()).toBeNull();
  });

  it('should set selectedParent when onParentSelected is called', () => {
    const mockParent: Ticket = {
      id: 'SS-1', type: 'epic', title: 'Parent Epic',
      status: 'Open', priority: 'High',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
    };
    component.onParentSelected(mockParent);
    expect(component.selectedParent()).toBe(mockParent);
    expect(component.form.controls.parentSearch.value).toBe('Parent Epic');
  });

  it('should clear parent when clearParent is called', () => {
    const mockParent: Ticket = {
      id: 'SS-1', type: 'epic', title: 'Parent Epic',
      status: 'Open', priority: 'High',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
    };
    component.onParentSelected(mockParent);
    component.clearParent();
    expect(component.selectedParent()).toBeNull();
    expect(component.form.controls.parentSearch.value).toBe('');
  });

  it('should include parentId in request when parent is selected', fakeAsync(() => {
    spyOn(router, 'navigate');
    const mockParent: Ticket = {
      id: 'SS-1', type: 'epic', title: 'Parent Epic',
      status: 'Open', priority: 'High',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
    };
    component.onParentSelected(mockParent);
    component.form.controls.title.setValue('Child story');
    component.form.controls.type.setValue('story');
    component.onSubmit();

    const req = httpMock.expectOne(r => r.method === 'POST');
    expect(req.request.body.parentId).toBe('SS-1');

    req.flush({ data: { ...MOCK_CREATED_TICKET, type: 'story', title: 'Child story', parentId: 'SS-1' } });
    tick(3000);
  }));

  it('should not include parentId when no parent is selected', fakeAsync(() => {
    spyOn(router, 'navigate');
    component.form.controls.title.setValue('Standalone task');
    component.form.controls.type.setValue('task');
    component.onSubmit();

    const req = httpMock.expectOne(r => r.method === 'POST');
    expect(req.request.body.parentId).toBeUndefined();

    req.flush({ data: { ...MOCK_CREATED_TICKET, type: 'task', title: 'Standalone task' } });
    tick(3000);
  }));

  // Story 2.1: Hierarchy warning (AC #10 client-side validation)
  it('should show hierarchy warning for invalid parent-child combo', () => {
    const mockEpicParent: Ticket = {
      id: 'SS-1', type: 'epic', title: 'Parent Epic',
      status: 'Open', priority: 'High',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
    };
    component.onParentSelected(mockEpicParent);
    component.form.controls.type.setValue('task');
    // Trigger change detection for the computed signal
    fixture.detectChanges();
    // Need to wait for the valueChanges subscription to fire
    expect(component.hierarchyWarning()).toContain('epic cannot contain task');
  });

  it('should not show hierarchy warning for valid parent-child combo', () => {
    const mockEpicParent: Ticket = {
      id: 'SS-1', type: 'epic', title: 'Parent Epic',
      status: 'Open', priority: 'High',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
    };
    component.onParentSelected(mockEpicParent);
    component.form.controls.type.setValue('story');
    fixture.detectChanges();
    expect(component.hierarchyWarning()).toBe('');
  });

  it('should update parentSearch signal on input', () => {
    const input = fixture.nativeElement.querySelector('input[formControlName="parentSearch"]');
    input.value = 'Epic';
    input.dispatchEvent(new Event('input'));
    expect(component.parentSearch()).toBe('Epic');
  });

  // Story 6.3 AC#6: Assignee field is a dropdown populated from active user mappings
  it('should have activeUserNames computed signal', () => {
    expect(component.activeUserNames).toBeDefined();
    expect(Array.isArray(component.activeUserNames())).toBeTrue();
  });

  it('should render assignee as mat-select instead of text input', () => {
    const assigneeSelect = fixture.nativeElement.querySelector('mat-select[formControlName="assignee"]');
    expect(assigneeSelect).toBeTruthy();
    const assigneeInput = fixture.nativeElement.querySelector('input[formControlName="assignee"]');
    expect(assigneeInput).toBeFalsy();
  });

  // Story 6.3 AC#6: Assignee dropdown populated from active user mappings
  it('should populate activeUserNames from UserMappingService', () => {
    // Flush all pending /api/users requests (ensureLoaded from ngOnInit) with mock user data
    const userReqs = httpMock.match(r => r.url.includes('/api/users') && r.method === 'GET');
    const mockUsersResponse = {
      data: [
        { id: 1, irisUsername: '_SYSTEM', displayName: 'System Admin', isActive: true, createdAt: '', updatedAt: '' },
        { id: 2, irisUsername: 'bob', displayName: 'Bob Dev', isActive: true, createdAt: '', updatedAt: '' },
        { id: 3, irisUsername: 'inactive', displayName: 'Gone User', isActive: false, createdAt: '', updatedAt: '' },
      ],
      total: 3, page: 1, pageSize: 100, totalPages: 1,
    };
    userReqs.forEach(r => r.flush(mockUsersResponse));

    expect(component.activeUserNames()).toEqual(['System Admin', 'Bob Dev']);
  });

  // Story 6.3 AC#6: Assignee selected value is sent in create request
  it('should include assignee display name in create request when selected', fakeAsync(() => {
    spyOn(router, 'navigate');
    component.form.controls.title.setValue('Assigned ticket');
    component.form.controls.type.setValue('task');
    component.form.controls.assignee.setValue('System Admin');
    component.onSubmit();

    const req = httpMock.expectOne(r => r.method === 'POST');
    expect(req.request.body.assignee).toBe('System Admin');

    req.flush({ data: { ...MOCK_CREATED_TICKET, type: 'task', title: 'Assigned ticket', assignee: 'System Admin' } });
    tick(3000);
  }));

  it('should clear selectedParent when parentSearch input is emptied', () => {
    const mockParent: Ticket = {
      id: 'SS-1', type: 'epic', title: 'Parent Epic',
      status: 'Open', priority: 'High',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
    };
    component.onParentSelected(mockParent);
    const input = fixture.nativeElement.querySelector('input[formControlName="parentSearch"]');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(component.selectedParent()).toBeNull();
  });
});

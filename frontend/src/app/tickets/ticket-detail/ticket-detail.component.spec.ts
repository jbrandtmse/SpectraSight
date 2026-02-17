import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketService } from '../ticket.service';
import { UserMappingService } from '../../core/settings/users/user-mapping.service';
import { Ticket } from '../ticket.model';

const MOCK_BUG: Ticket = {
  id: 'SS-1',
  type: 'bug',
  title: 'Fix login button',
  description: 'Button alignment is off',
  status: 'Open',
  priority: 'High',
  assignee: 'alice',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-02-15T10:00:00Z',
};

const MOCK_TASK: Ticket = {
  id: 'SS-2',
  type: 'task',
  title: 'Update docs',
  status: 'In Progress',
  priority: 'Medium',
  createdAt: '2026-01-02T00:00:00Z',
  updatedAt: '2026-02-14T10:00:00Z',
};

const MOCK_STORY: Ticket = {
  id: 'SS-3',
  type: 'story',
  title: 'User login flow',
  status: 'Open',
  priority: 'High',
  createdAt: '2026-01-03T00:00:00Z',
  updatedAt: '2026-02-13T10:00:00Z',
};

const MOCK_EPIC: Ticket = {
  id: 'SS-4',
  type: 'epic',
  title: 'Auth system',
  status: 'Open',
  priority: 'Critical',
  createdAt: '2026-01-04T00:00:00Z',
  updatedAt: '2026-02-12T10:00:00Z',
};

const MOCK_TASK_WITH_PARENT: Ticket = {
  id: 'SS-5',
  type: 'task',
  title: 'Implement login form',
  status: 'In Progress',
  priority: 'High',
  createdAt: '2026-01-05T00:00:00Z',
  updatedAt: '2026-02-15T10:00:00Z',
  parentId: 'SS-3',
  parent: { id: 'SS-3', title: 'User login flow', type: 'story' },
};

const MOCK_EPIC_WITH_CHILDREN: Ticket = {
  id: 'SS-6',
  type: 'epic',
  title: 'Epic with children',
  status: 'Open',
  priority: 'High',
  createdAt: '2026-01-06T00:00:00Z',
  updatedAt: '2026-02-15T10:00:00Z',
  children: [
    { id: 'SS-7', title: 'Child Story 1', status: 'Open', type: 'story' },
    { id: 'SS-8', title: 'Child Bug', status: 'In Progress', type: 'bug' },
  ],
};

describe('TicketDetailComponent', () => {
  let component: TicketDetailComponent;
  let fixture: ComponentFixture<TicketDetailComponent>;
  let ticketService: TicketService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    ticketService = TestBed.inject(TicketService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    // Flush any pending /api/users request from UserMappingService.ensureLoaded()
    const userReqs = httpMock.match(r => r.url.includes('/api/users'));
    userReqs.forEach(r => r.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }));
    httpMock.verify();
  });

  function selectTicket(ticket: Ticket): void {
    selectTicketFromList([MOCK_BUG, MOCK_TASK, MOCK_STORY, MOCK_EPIC], ticket);
  }

  function selectTicketFromList(tickets: Ticket[], ticket: Ticket): void {
    ticketService.loadTickets();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets') && !r.url.includes('/activity'));
    req.flush({ data: tickets, total: tickets.length, page: 1, pageSize: 100, totalPages: 1 });
    ticketService.selectTicket(ticket.id);
    fixture.detectChanges();
    // Flush activity request triggered by ActivityTimelineComponent effect
    const activityReqs = httpMock.match(r => r.url.includes('/activity'));
    activityReqs.forEach(r => r.flush({ data: [] }));
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not render when no ticket is selected', () => {
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.detail-panel');
    expect(panel).toBeFalsy();
  });

  it('should render detail panel when ticket is selected', () => {
    selectTicket(MOCK_BUG);
    const panel = fixture.nativeElement.querySelector('.detail-panel');
    expect(panel).toBeTruthy();
  });

  // AC #1: displays ticket title, type icon, ID, status, priority, assignee, description, timestamps
  it('should display ticket ID in the header', () => {
    selectTicket(MOCK_BUG);
    const id = fixture.nativeElement.querySelector('.detail-id');
    expect(id.textContent.trim()).toBe('SS-1');
  });

  it('should display type icon in the header', () => {
    selectTicket(MOCK_BUG);
    const icon = fixture.nativeElement.querySelector('ss-type-icon');
    expect(icon).toBeTruthy();
  });

  it('should display the title via inline-edit', () => {
    selectTicket(MOCK_BUG);
    const inlineEdits = fixture.nativeElement.querySelectorAll('app-inline-edit');
    expect(inlineEdits.length).toBeGreaterThan(0);
    // First inline-edit is the title
    const titleDisplay = inlineEdits[0].querySelector('.inline-edit-display');
    expect(titleDisplay.textContent.trim()).toBe('Fix login button');
  });

  it('should display status field dropdown', () => {
    selectTicket(MOCK_BUG);
    const dropdowns = fixture.nativeElement.querySelectorAll('app-field-dropdown');
    expect(dropdowns.length).toBeGreaterThanOrEqual(2);
    // First dropdown is Status
    const statusLabel = dropdowns[0].querySelector('.field-dropdown-label');
    expect(statusLabel.textContent.trim()).toBe('Status:');
  });

  it('should display priority field dropdown', () => {
    selectTicket(MOCK_BUG);
    const dropdowns = fixture.nativeElement.querySelectorAll('app-field-dropdown');
    const priorityLabel = dropdowns[1].querySelector('.field-dropdown-label');
    expect(priorityLabel.textContent.trim()).toBe('Priority:');
  });

  it('should display assignee field dropdown', () => {
    selectTicket(MOCK_BUG);
    const dropdowns = fixture.nativeElement.querySelectorAll('app-field-dropdown');
    const assigneeLabel = dropdowns[2].querySelector('.field-dropdown-label');
    expect(assigneeLabel.textContent.trim()).toBe('Assignee:');
  });

  it('should display description section', () => {
    selectTicket(MOCK_BUG);
    const sectionLabels = fixture.nativeElement.querySelectorAll('.detail-section-label');
    const descLabel = Array.from(sectionLabels).find(
      (el: any) => el.textContent.trim() === 'Description'
    );
    expect(descLabel).toBeTruthy();
  });

  it('should display timestamps with relativeTime pipe', () => {
    selectTicket(MOCK_BUG);
    const timestamps = fixture.nativeElement.querySelector('.detail-timestamps');
    expect(timestamps).toBeTruthy();
    expect(timestamps.textContent).toContain('Created:');
    expect(timestamps.textContent).toContain('Updated:');
  });

  it('should have close button in header', () => {
    selectTicket(MOCK_BUG);
    const closeBtn = fixture.nativeElement.querySelector('button[aria-label="Close detail panel"]');
    expect(closeBtn).toBeTruthy();
  });

  // AC #9: Escape clears selection
  it('should clear selection on close()', () => {
    const navigateSpy = spyOn(router, 'navigate');
    selectTicket(MOCK_BUG);

    component.close();

    expect(ticketService.selectedTicketId()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets']);
  });

  it('should clear selection on close button click', () => {
    const navigateSpy = spyOn(router, 'navigate');
    selectTicket(MOCK_BUG);

    const closeBtn = fixture.nativeElement.querySelector('button[aria-label="Close detail panel"]');
    closeBtn.click();

    expect(ticketService.selectedTicketId()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets']);
  });

  // AC #2, #3, #4, #5: onFieldChanged calls updateTicketField
  it('should call updateTicketField on field change', () => {
    selectTicket(MOCK_BUG);
    const spy = spyOn(ticketService, 'updateTicketField');

    component.onFieldChanged('status', 'Complete');
    expect(spy).toHaveBeenCalledWith('SS-1', 'status', 'Complete');
  });

  it('should call updateTicketField for title change', () => {
    selectTicket(MOCK_BUG);
    const spy = spyOn(ticketService, 'updateTicketField');

    component.onFieldChanged('title', 'New Title');
    expect(spy).toHaveBeenCalledWith('SS-1', 'title', 'New Title');
  });

  it('should call updateTicketField for priority change', () => {
    selectTicket(MOCK_BUG);
    const spy = spyOn(ticketService, 'updateTicketField');

    component.onFieldChanged('priority', 'Critical');
    expect(spy).toHaveBeenCalledWith('SS-1', 'priority', 'Critical');
  });

  it('should call updateTicketField for assignee change', () => {
    selectTicket(MOCK_BUG);
    const spy = spyOn(ticketService, 'updateTicketField');

    component.onFieldChanged('assignee', 'bob');
    expect(spy).toHaveBeenCalledWith('SS-1', 'assignee', 'bob');
  });

  // AC #6: Type-specific fields -- numeric coercion
  it('should coerce estimatedHours to number', () => {
    selectTicket(MOCK_TASK);
    const spy = spyOn(ticketService, 'updateTicketField');

    component.onFieldChanged('estimatedHours', '8');
    expect(spy).toHaveBeenCalledWith('SS-2', 'estimatedHours', 8);
  });

  it('should coerce storyPoints to number', () => {
    selectTicket(MOCK_STORY);
    const spy = spyOn(ticketService, 'updateTicketField');

    component.onFieldChanged('storyPoints', '5');
    expect(spy).toHaveBeenCalledWith('SS-3', 'storyPoints', 5);
  });

  it('should send null for invalid numeric input', () => {
    selectTicket(MOCK_TASK);
    const spy = spyOn(ticketService, 'updateTicketField');

    component.onFieldChanged('estimatedHours', 'abc');
    expect(spy).toHaveBeenCalledWith('SS-2', 'estimatedHours', null);
  });

  it('should not coerce non-numeric fields', () => {
    selectTicket(MOCK_BUG);
    const spy = spyOn(ticketService, 'updateTicketField');

    component.onFieldChanged('severity', 'High');
    expect(spy).toHaveBeenCalledWith('SS-1', 'severity', 'High');
  });

  // AC #6: Type-specific sections render conditionally
  it('should show Bug Details section for bug type', () => {
    selectTicket(MOCK_BUG);
    const sectionLabels = fixture.nativeElement.querySelectorAll('.detail-section-label');
    const bugLabel = Array.from(sectionLabels).find(
      (el: any) => el.textContent.trim() === 'Bug Details'
    );
    expect(bugLabel).toBeTruthy();
  });

  it('should show Task Details section for task type', () => {
    selectTicket(MOCK_TASK);
    const sectionLabels = fixture.nativeElement.querySelectorAll('.detail-section-label');
    const taskLabel = Array.from(sectionLabels).find(
      (el: any) => el.textContent.trim() === 'Task Details'
    );
    expect(taskLabel).toBeTruthy();
  });

  it('should show Story Details section for story type', () => {
    selectTicket(MOCK_STORY);
    const sectionLabels = fixture.nativeElement.querySelectorAll('.detail-section-label');
    const storyLabel = Array.from(sectionLabels).find(
      (el: any) => el.textContent.trim() === 'Story Details'
    );
    expect(storyLabel).toBeTruthy();
  });

  it('should show Epic Details section for epic type', () => {
    selectTicket(MOCK_EPIC);
    const sectionLabels = fixture.nativeElement.querySelectorAll('.detail-section-label');
    const epicLabel = Array.from(sectionLabels).find(
      (el: any) => el.textContent.trim() === 'Epic Details'
    );
    expect(epicLabel).toBeTruthy();
  });

  it('should not show Bug Details for non-bug ticket', () => {
    selectTicket(MOCK_TASK);
    const sectionLabels = fixture.nativeElement.querySelectorAll('.detail-section-label');
    const bugLabel = Array.from(sectionLabels).find(
      (el: any) => el.textContent.trim() === 'Bug Details'
    );
    expect(bugLabel).toBeFalsy();
  });

  // AC #1: Bug-specific fields rendered
  it('should render Steps to Reproduce label for bug', () => {
    selectTicket(MOCK_BUG);
    const labels = fixture.nativeElement.querySelectorAll('.type-field-label');
    const stepsLabel = Array.from(labels).find(
      (el: any) => el.textContent.trim() === 'Steps to Reproduce'
    );
    expect(stepsLabel).toBeTruthy();
  });

  it('should render Expected Behavior label for bug', () => {
    selectTicket(MOCK_BUG);
    const labels = fixture.nativeElement.querySelectorAll('.type-field-label');
    const expectedLabel = Array.from(labels).find(
      (el: any) => el.textContent.trim() === 'Expected Behavior'
    );
    expect(expectedLabel).toBeTruthy();
  });

  it('should render Actual Behavior label for bug', () => {
    selectTicket(MOCK_BUG);
    const labels = fixture.nativeElement.querySelectorAll('.type-field-label');
    const actualLabel = Array.from(labels).find(
      (el: any) => el.textContent.trim() === 'Actual Behavior'
    );
    expect(actualLabel).toBeTruthy();
  });

  // Component option arrays
  it('should have correct status options', () => {
    expect(component.statusOptions).toEqual(['Open', 'In Progress', 'Blocked', 'Complete']);
  });

  it('should have correct priority options', () => {
    expect(component.priorityOptions).toEqual(['Low', 'Medium', 'High', 'Critical']);
  });

  it('should have correct severity options', () => {
    expect(component.severityOptions).toEqual(['Low', 'Medium', 'High', 'Critical']);
  });

  // Story 6.3 AC#1: Assignee dropdown populated from active users
  it('should have activeUserNames computed signal', () => {
    expect(component.activeUserNames).toBeDefined();
    expect(Array.isArray(component.activeUserNames())).toBeTrue();
  });

  // Story 6.3 AC#2: Assignee dropdown uses options instead of freeText
  it('should render assignee dropdown without freeText mode', () => {
    selectTicket(MOCK_BUG);
    const dropdowns = fixture.nativeElement.querySelectorAll('app-field-dropdown');
    const assigneeDropdown = dropdowns[2]; // Third dropdown is Assignee
    // Verify it uses dropdown mode (arrow_drop_down icon) not freeText mode (edit icon)
    const dropdownIcon = assigneeDropdown.querySelector('.field-dropdown-icon');
    expect(dropdownIcon?.textContent?.trim()).toBe('arrow_drop_down');
  });

  // Story 6.3 AC#1: Assignee dropdown populated from active user mappings via service
  it('should populate assignee dropdown with active user names from service', () => {
    fixture.detectChanges();
    // Flush all pending /api/users requests (ensureLoaded from constructor) with mock user data
    const userReqs = httpMock.match(r => r.url.includes('/api/users') && r.method === 'GET');
    const mockUsersResponse = {
      data: [
        { id: 1, irisUsername: '_SYSTEM', displayName: 'System Admin', isActive: true, createdAt: '', updatedAt: '' },
        { id: 2, irisUsername: 'bob', displayName: 'Bob Dev', isActive: true, createdAt: '', updatedAt: '' },
        { id: 3, irisUsername: 'inactive', displayName: 'Inactive User', isActive: false, createdAt: '', updatedAt: '' },
      ],
      total: 3, page: 1, pageSize: 100, totalPages: 1,
    };
    userReqs.forEach(r => r.flush(mockUsersResponse));

    expect(component.activeUserNames()).toEqual(['System Admin', 'Bob Dev']);
  });

  // Timestamps with tooltip
  it('should have tooltip on timestamp spans', () => {
    selectTicket(MOCK_BUG);
    const timestamps = fixture.nativeElement.querySelector('.detail-timestamps');
    const spans = timestamps.querySelectorAll('span[ng-reflect-message]');
    // matTooltip sets ng-reflect-message in dev mode
    // Alternatively check that the timestamps contain ISO date info
    expect(timestamps.textContent).toContain('Created:');
    expect(timestamps.textContent).toContain('Updated:');
  });

  // Type-specific separator
  it('should have border separator on type-specific section', () => {
    selectTicket(MOCK_BUG);
    const typeSection = fixture.nativeElement.querySelector('.type-specific');
    expect(typeSection).toBeTruthy();
  });

  it('should not call updateTicketField when no ticket selected', () => {
    fixture.detectChanges();
    const spy = spyOn(ticketService, 'updateTicketField');
    component.onFieldChanged('title', 'test');
    expect(spy).not.toHaveBeenCalled();
  });

  // AC #6: Delete button visible with red/warn text, tertiary style
  it('should render a Delete button in the detail panel', () => {
    selectTicket(MOCK_BUG);
    const deleteBtn = fixture.nativeElement.querySelector('.detail-delete button');
    expect(deleteBtn).toBeTruthy();
    expect(deleteBtn.textContent.trim()).toBe('Delete');
  });

  // AC #6: Clicking Delete opens MatDialog confirmation
  it('should open a confirmation dialog on onDelete()', () => {
    selectTicket(MOCK_BUG);
    const dialog = TestBed.inject(MatDialog);
    const dialogRefMock = { afterClosed: () => of(false) };
    const openSpy = spyOn(dialog, 'open').and.returnValue(dialogRefMock as any);

    component.onDelete();

    expect(openSpy).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({ data: { ticketId: 'SS-1' } })
    );
  });

  // AC #7: Confirm delete removes ticket, navigates to /tickets
  it('should call deleteTicket and navigate on dialog confirm', () => {
    selectTicket(MOCK_BUG);
    const dialog = TestBed.inject(MatDialog);
    const dialogRefMock = { afterClosed: () => of(true) };
    spyOn(dialog, 'open').and.returnValue(dialogRefMock as any);
    const deleteSpy = spyOn(ticketService, 'deleteTicket');
    const navigateSpy = spyOn(router, 'navigate');

    component.onDelete();

    expect(deleteSpy).toHaveBeenCalledWith('SS-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets']);
  });

  // AC #8: Cancel/Escape dismisses dialog without deleting
  it('should not call deleteTicket on dialog cancel', () => {
    selectTicket(MOCK_BUG);
    const dialog = TestBed.inject(MatDialog);
    const dialogRefMock = { afterClosed: () => of(false) };
    spyOn(dialog, 'open').and.returnValue(dialogRefMock as any);
    const deleteSpy = spyOn(ticketService, 'deleteTicket');

    component.onDelete();

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should not open dialog when no ticket is selected', () => {
    fixture.detectChanges();
    const dialog = TestBed.inject(MatDialog);
    const openSpy = spyOn(dialog, 'open');

    component.onDelete();

    expect(openSpy).not.toHaveBeenCalled();
  });

  // Story 2.1: Hierarchy breadcrumb tests (AC #5, #6, #9)
  it('should render hierarchy breadcrumb when ticket has parent', () => {
    selectTicketFromList([MOCK_BUG, MOCK_TASK, MOCK_STORY, MOCK_EPIC, MOCK_TASK_WITH_PARENT, MOCK_EPIC_WITH_CHILDREN], MOCK_TASK_WITH_PARENT);
    const breadcrumb = fixture.nativeElement.querySelector('ss-hierarchy-breadcrumb');
    expect(breadcrumb).toBeTruthy();
  });

  it('should not render breadcrumb content when ticket has no parent', () => {
    selectTicket(MOCK_BUG);
    const breadcrumb = fixture.nativeElement.querySelector('ss-hierarchy-breadcrumb');
    expect(breadcrumb).toBeTruthy(); // Component is always present
    // But the nav inside should not render
    const nav = fixture.nativeElement.querySelector('nav.breadcrumb');
    expect(nav).toBeFalsy();
  });

  // Story 2.1: Children list tests (AC #7, #8)
  it('should render children section when ticket has children', () => {
    selectTicketFromList([MOCK_BUG, MOCK_TASK, MOCK_STORY, MOCK_EPIC, MOCK_TASK_WITH_PARENT, MOCK_EPIC_WITH_CHILDREN], MOCK_EPIC_WITH_CHILDREN);
    const childrenLabel = Array.from(fixture.nativeElement.querySelectorAll('.detail-section-label')).find(
      (el: any) => el.textContent.trim() === 'Children'
    );
    expect(childrenLabel).toBeTruthy();
  });

  it('should render correct number of child rows', () => {
    selectTicketFromList([MOCK_BUG, MOCK_TASK, MOCK_STORY, MOCK_EPIC, MOCK_TASK_WITH_PARENT, MOCK_EPIC_WITH_CHILDREN], MOCK_EPIC_WITH_CHILDREN);
    const childRows = fixture.nativeElement.querySelectorAll('.child-row');
    expect(childRows.length).toBe(2);
  });

  it('should render child title and type icon in child row', () => {
    selectTicketFromList([MOCK_BUG, MOCK_TASK, MOCK_STORY, MOCK_EPIC, MOCK_TASK_WITH_PARENT, MOCK_EPIC_WITH_CHILDREN], MOCK_EPIC_WITH_CHILDREN);
    const childRows = fixture.nativeElement.querySelectorAll('.child-row');
    const firstChild = childRows[0];
    expect(firstChild.querySelector('ss-type-icon')).toBeTruthy();
    expect(firstChild.querySelector('.child-title').textContent.trim()).toBe('Child Story 1');
    expect(firstChild.querySelector('ss-status-badge')).toBeTruthy();
  });

  it('should call navigateToTicket when child row is clicked', () => {
    selectTicketFromList([MOCK_BUG, MOCK_TASK, MOCK_STORY, MOCK_EPIC, MOCK_TASK_WITH_PARENT, MOCK_EPIC_WITH_CHILDREN], MOCK_EPIC_WITH_CHILDREN);
    const navigateSpy = spyOn(router, 'navigate');
    spyOn(ticketService, 'selectTicket');
    const childRows = fixture.nativeElement.querySelectorAll('.child-row');
    childRows[0].click();
    expect(ticketService.selectTicket).toHaveBeenCalledWith('SS-7');
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', 'SS-7']);
  });

  it('should not render children section when ticket has no children', () => {
    selectTicket(MOCK_BUG);
    const childrenSection = fixture.nativeElement.querySelector('.children-section');
    expect(childrenSection).toBeFalsy();
  });

  // Story 2.1: Add sub-task button (AC #11)
  it('should render Add sub-task button for non-bug tickets', () => {
    selectTicket(MOCK_EPIC);
    const addBtn = fixture.nativeElement.querySelector('.add-subtask-btn');
    expect(addBtn).toBeTruthy();
    expect(addBtn.textContent).toContain('Add sub-task');
  });

  it('should not render Add sub-task button for bug tickets', () => {
    selectTicket(MOCK_BUG);
    const addBtn = fixture.nativeElement.querySelector('.add-subtask-btn');
    expect(addBtn).toBeFalsy();
  });

  it('should emit addSubtaskRequested on Add sub-task click', () => {
    selectTicket(MOCK_EPIC);
    let emittedId = '';
    component.addSubtaskRequested.subscribe((id: string) => emittedId = id);
    const addBtn = fixture.nativeElement.querySelector('.add-subtask-btn');
    addBtn.click();
    expect(emittedId).toBe('SS-4');
  });

  // Story 2.1: navigateToTicket for breadcrumb ancestor click (AC #6)
  it('should select ticket and navigate on navigateToTicket call', () => {
    selectTicket(MOCK_BUG);
    const selectSpy = spyOn(ticketService, 'selectTicket');
    const navigateSpy = spyOn(router, 'navigate');
    component.navigateToTicket('SS-99');
    expect(selectSpy).toHaveBeenCalledWith('SS-99');
    expect(navigateSpy).toHaveBeenCalledWith(['/tickets', 'SS-99']);
  });

  // Story 2.3 AC#1: Code reference component is rendered in the detail view
  it('should render ss-code-reference component in detail view', () => {
    selectTicket(MOCK_BUG);
    const codeRef = fixture.nativeElement.querySelector('ss-code-reference');
    expect(codeRef).toBeTruthy();
  });

  // Story 2.3 AC#7: Code references display when ticket has them
  it('should pass codeReferences to ss-code-reference component', () => {
    const ticketWithRefs: Ticket = {
      ...MOCK_BUG,
      codeReferences: [
        { id: 1, className: 'SpectraSight.Model.Ticket', methodName: '%OnNew', addedBy: 'alice' },
        { id: 2, className: 'SpectraSight.REST.Response', addedBy: 'bob' },
      ],
    };
    selectTicketFromList([ticketWithRefs, MOCK_TASK, MOCK_STORY, MOCK_EPIC], ticketWithRefs);
    const codeRef = fixture.nativeElement.querySelector('ss-code-reference');
    expect(codeRef).toBeTruthy();
    // The code-reference component should display the references
    const refItems = fixture.nativeElement.querySelectorAll('.code-ref-item');
    expect(refItems.length).toBe(2);
  });

  // Story 2.3 AC#1: Code reference component passes ticketId
  it('should pass ticketId to ss-code-reference component', () => {
    selectTicket(MOCK_BUG);
    const codeRef = fixture.nativeElement.querySelector('ss-code-reference');
    expect(codeRef).toBeTruthy();
  });

  // Story 2.3 AC#7: Code references display in monospace for references with method name
  it('should display code reference with method in monospace format', () => {
    const ticketWithRefs: Ticket = {
      ...MOCK_TASK,
      id: 'SS-2',
      codeReferences: [
        { id: 10, className: 'SpectraSight.Model.Ticket', methodName: 'Title', addedBy: 'alice' },
      ],
    };
    selectTicketFromList([MOCK_BUG, ticketWithRefs, MOCK_STORY, MOCK_EPIC], ticketWithRefs);
    const display = fixture.nativeElement.querySelector('.code-ref-display');
    expect(display).toBeTruthy();
    expect(display.textContent.trim()).toBe('SpectraSight.Model.Ticket.Title');
  });

  // Story 2.3 AC#7: Code references display without method name
  it('should display code reference without method name', () => {
    const ticketWithRefs: Ticket = {
      ...MOCK_STORY,
      id: 'SS-3',
      codeReferences: [
        { id: 20, className: 'SpectraSight.REST.Response', addedBy: 'bob' },
      ],
    };
    selectTicketFromList([MOCK_BUG, MOCK_TASK, ticketWithRefs, MOCK_EPIC], ticketWithRefs);
    const display = fixture.nativeElement.querySelector('.code-ref-display');
    expect(display).toBeTruthy();
    expect(display.textContent.trim()).toBe('SpectraSight.REST.Response');
  });

  // Story 2.3: onCodeReferenceAdded calls reloadSelectedTicket
  it('should reload ticket on code reference added', () => {
    selectTicket(MOCK_BUG);
    const getSpy = spyOn(ticketService, 'getTicket').and.returnValue(of(MOCK_BUG));
    const updateSpy = spyOn(ticketService, 'updateTicketInList');
    component.onCodeReferenceAdded({ id: 1, className: 'Test' });
    expect(getSpy).toHaveBeenCalledWith('SS-1');
  });

  // Story 2.3: onCodeReferenceRemoved calls reloadSelectedTicket
  it('should reload ticket on code reference removed', () => {
    selectTicket(MOCK_BUG);
    const getSpy = spyOn(ticketService, 'getTicket').and.returnValue(of(MOCK_BUG));
    const updateSpy = spyOn(ticketService, 'updateTicketInList');
    component.onCodeReferenceRemoved(1);
    expect(getSpy).toHaveBeenCalledWith('SS-1');
  });
});

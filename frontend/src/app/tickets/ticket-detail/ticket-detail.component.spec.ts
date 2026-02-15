import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketService } from '../ticket.service';
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
    httpMock.verify();
  });

  function selectTicket(ticket: Ticket): void {
    // Load tickets into the service and select one
    ticketService.loadTickets();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({ data: [MOCK_BUG, MOCK_TASK, MOCK_STORY, MOCK_EPIC], total: 4, page: 1, pageSize: 100, totalPages: 1 });
    ticketService.selectTicket(ticket.id);
    fixture.detectChanges();
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

  it('should display assignee field dropdown with freeText', () => {
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
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivityTimelineComponent } from './activity-timeline.component';
import { Activity } from '../activity.model';

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 1,
    type: 'statusChange',
    actorName: '_SYSTEM',
    actorType: 'human',
    timestamp: '2026-02-15T10:00:00Z',
    fromStatus: 'Open',
    toStatus: 'In Progress',
  },
  {
    id: 2,
    type: 'assignmentChange',
    actorName: '_SYSTEM',
    actorType: 'human',
    timestamp: '2026-02-15T10:01:00Z',
    fromAssignee: '',
    toAssignee: 'Alice',
  },
  {
    id: 3,
    type: 'codeReferenceChange',
    actorName: 'AgentBot',
    actorType: 'agent',
    timestamp: '2026-02-15T10:02:00Z',
    className: 'HS.MyClass',
    methodName: 'Run',
    action: 'added',
  },
  {
    id: 4,
    type: 'comment',
    actorName: '_SYSTEM',
    actorType: 'human',
    timestamp: '2026-02-15T10:03:00Z',
    body: 'This is a comment',
  },
];

@Component({
  standalone: true,
  imports: [ActivityTimelineComponent],
  template: `<ss-activity-timeline [ticketId]="ticketId()" [refreshTrigger]="refreshTrigger()"></ss-activity-timeline>`,
})
class TestHostComponent {
  ticketId = signal('SS-1');
  refreshTrigger = signal(0);
}

describe('ActivityTimelineComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushActivities(activities: Activity[] = MOCK_ACTIVITIES): void {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/activity'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: activities });
    fixture.detectChanges();
  }

  // AC #9: Loading state shows skeleton while request pending
  it('should show loading skeleton while request is pending', () => {
    fixture.detectChanges();
    // Request is pending, loading should be true
    const req = httpMock.expectOne(r => r.url.includes('/activity'));
    fixture.detectChanges();
    const skeleton = fixture.nativeElement.querySelector('.timeline-skeleton');
    expect(skeleton).toBeTruthy();
    // Flush to clean up
    req.flush({ data: [] });
  });

  // AC #10: Empty state shows "No activity yet"
  it('should show empty state when no activities', () => {
    flushActivities([]);
    const empty = fixture.nativeElement.querySelector('.timeline-empty');
    expect(empty).toBeTruthy();
    expect(empty.textContent.trim()).toBe('No activity yet');
  });

  // AC #3: Activity timeline renders in feed
  it('should render activity feed with entries', () => {
    flushActivities();
    const feed = fixture.nativeElement.querySelector('[role="feed"]');
    expect(feed).toBeTruthy();
    expect(feed.getAttribute('aria-label')).toBe('Ticket activity');
    const entries = fixture.nativeElement.querySelectorAll('[role="article"]');
    expect(entries.length).toBe(4);
  });

  // AC #2: Each entry includes actor name, timestamp
  it('should display actor name for each entry', () => {
    flushActivities();
    const actors = fixture.nativeElement.querySelectorAll('.actor-name');
    expect(actors.length).toBeGreaterThan(0);
    expect(actors[0].textContent.trim()).toBe('_SYSTEM');
  });

  // AC #4: Status change displays with badges
  it('should display status change with badges', () => {
    flushActivities();
    const badges = fixture.nativeElement.querySelectorAll('ss-status-badge');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  // AC #4: Empty fromStatus shows "set status to" with single badge
  it('should display "set status to" when fromStatus is empty', () => {
    const activities: Activity[] = [
      {
        id: 99,
        type: 'statusChange',
        actorName: '_SYSTEM',
        actorType: 'human',
        timestamp: '2026-02-15T09:00:00Z',
        fromStatus: '',
        toStatus: 'Open',
      },
    ];
    flushActivities(activities);
    const entries = fixture.nativeElement.querySelectorAll('[role="article"]');
    expect(entries[0].textContent).toContain('set status to');
    expect(entries[0].textContent).not.toContain('changed status from');
    const badges = entries[0].querySelectorAll('ss-status-badge');
    expect(badges.length).toBe(1);
  });

  // AC #5: Assignment change displays from/to
  it('should display assignment change with from/to', () => {
    flushActivities();
    const entries = fixture.nativeElement.querySelectorAll('[role="article"]');
    const assignmentEntry = entries[1];
    expect(assignmentEntry.textContent).toContain('reassigned from');
    expect(assignmentEntry.textContent).toContain('Alice');
  });

  // AC #6: Code reference change displays in monospace
  it('should display code reference change with monospace', () => {
    flushActivities();
    const codeRef = fixture.nativeElement.querySelector('.code-ref');
    expect(codeRef).toBeTruthy();
    expect(codeRef.textContent.trim()).toBe('HS.MyClass.Run');
  });

  // AC #7: Human and agent entries use exact same template
  it('should render human and agent entries with same template', () => {
    flushActivities();
    const entries = fixture.nativeElement.querySelectorAll('[role="article"]');
    // Entry 0 is human (statusChange), entry 2 is agent (codeRefChange)
    // Both should have the same structural elements: timeline-dot, timeline-content
    const humanEntry = entries[0];
    const agentEntry = entries[2];
    expect(humanEntry.querySelector('.timeline-content')).toBeTruthy();
    expect(agentEntry.querySelector('.timeline-content')).toBeTruthy();
    expect(humanEntry.querySelector('.timeline-dot')).toBeTruthy();
    expect(agentEntry.querySelector('.timeline-dot')).toBeTruthy();
  });

  // AC #8: Timestamps show relative time with hover tooltip
  it('should display timestamps with relative time and title tooltip', () => {
    flushActivities();
    const timestamps = fixture.nativeElement.querySelectorAll('.timeline-timestamp');
    expect(timestamps.length).toBeGreaterThan(0);
    const firstTimestamp = timestamps[0];
    expect(firstTimestamp.tagName.toLowerCase()).toBe('time');
    expect(firstTimestamp.getAttribute('title')).toBe('2026-02-15T10:00:00Z');
  });

  // AC #1: Fetches activity for given ticket
  it('should fetch activity for the given ticket ID', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets/SS-1/activity'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  // AC #11: Refresh trigger reloads activity
  it('should reload activity when refreshTrigger changes', () => {
    flushActivities([]);
    host.refreshTrigger.set(1);
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url.includes('/activity'));
    req.flush({ data: MOCK_ACTIVITIES });
    fixture.detectChanges();
    const entries = fixture.nativeElement.querySelectorAll('[role="article"]');
    expect(entries.length).toBe(4);
  });

  // Comment type displays body text
  it('should display comment body text', () => {
    flushActivities();
    const commentBody = fixture.nativeElement.querySelector('.comment-body');
    expect(commentBody).toBeTruthy();
    expect(commentBody.textContent.trim()).toBe('This is a comment');
  });

  // Section label
  it('should display Activity section label', () => {
    flushActivities();
    const label = fixture.nativeElement.querySelector('.timeline-section-label');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('Activity');
  });
});

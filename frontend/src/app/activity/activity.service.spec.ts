import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivityService } from './activity.service';
import { Activity, CommentActivity } from './activity.model';

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        ActivityService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('addComment', () => {
    const mockServerComment: CommentActivity = {
      id: 42,
      type: 'comment',
      actorName: '_SYSTEM',
      actorType: 'human',
      timestamp: '2026-02-15T12:00:00Z',
      body: 'Test comment body',
    };

    it('should POST to /api/tickets/:id/comments with body', () => {
      service.addComment('SS-1', 'Test comment body').subscribe();

      const req = httpMock.expectOne('/api/tickets/SS-1/comments');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ body: 'Test comment body' });
      req.flush({ data: mockServerComment });
    });

    it('should return the server comment from the response data envelope', () => {
      let result: CommentActivity | undefined;
      service.addComment('SS-1', 'Test comment body').subscribe((c) => {
        result = c;
      });

      const req = httpMock.expectOne('/api/tickets/SS-1/comments');
      req.flush({ data: mockServerComment });

      expect(result).toEqual(mockServerComment);
    });

    it('should optimistically add a temp comment to activities signal', () => {
      service.addComment('SS-1', 'Optimistic text').subscribe();

      // Before the HTTP response, the temp comment should be in the signal
      const activities = service.activities();
      expect(activities.length).toBe(1);
      expect(activities[0].type).toBe('comment');
      expect((activities[0] as CommentActivity).body).toBe('Optimistic text');
      expect(activities[0].actorName).toBe('You');
      expect(activities[0].id).toBeLessThan(0); // temp negative ID

      // Flush to avoid verify error
      const req = httpMock.expectOne('/api/tickets/SS-1/comments');
      req.flush({ data: mockServerComment });
    });

    it('should replace temp comment with server response on success', () => {
      service.addComment('SS-1', 'Test comment body').subscribe();

      const req = httpMock.expectOne('/api/tickets/SS-1/comments');
      req.flush({ data: mockServerComment });

      const activities = service.activities();
      expect(activities.length).toBe(1);
      expect(activities[0].id).toBe(42); // server ID replaced temp
      expect((activities[0] as CommentActivity).body).toBe(
        'Test comment body',
      );
      expect(activities[0].actorName).toBe('_SYSTEM');
    });

    it('should remove temp comment on HTTP error', () => {
      service.addComment('SS-1', 'Will fail').subscribe();

      const req = httpMock.expectOne('/api/tickets/SS-1/comments');
      req.flush(
        { error: { code: 'BAD_REQUEST', message: 'Comment body cannot be empty', status: 400 } },
        { status: 400, statusText: 'Bad Request' },
      );

      const activities = service.activities();
      expect(activities.length).toBe(0); // temp removed
    });

    it('should show snackbar with error message on failure', () => {
      service.addComment('SS-1', 'Will fail').subscribe();

      const req = httpMock.expectOne('/api/tickets/SS-1/comments');
      req.flush(
        { error: { message: 'Comment body cannot be empty' } },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Comment body cannot be empty',
        'Dismiss',
        { duration: 5000 },
      );
    });

    it('should show generic error message when server error lacks message', () => {
      service.addComment('SS-1', 'Will fail').subscribe();

      const req = httpMock.expectOne('/api/tickets/SS-1/comments');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to add comment',
        'Dismiss',
        { duration: 5000 },
      );
    });
  });

  describe('getActivity', () => {
    it('should GET /api/tickets/:id/activity and return data', () => {
      const mockActivities: Activity[] = [
        {
          id: 1,
          type: 'statusChange',
          actorName: '_SYSTEM',
          actorType: 'human',
          timestamp: '2026-02-15T10:00:00Z',
          fromStatus: 'Open',
          toStatus: 'In Progress',
        },
      ];

      let result: Activity[] | undefined;
      service.getActivity('SS-1').subscribe((a) => (result = a));

      const req = httpMock.expectOne('/api/tickets/SS-1/activity');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockActivities });

      expect(result).toEqual(mockActivities);
    });
  });

  describe('loadActivity', () => {
    it('should set activities signal after loading', () => {
      const mockActivities: Activity[] = [
        {
          id: 1,
          type: 'comment',
          actorName: 'dev1',
          actorType: 'human',
          timestamp: '2026-02-15T10:00:00Z',
          body: 'Loaded comment',
        },
      ];

      service.loadActivity('SS-2');

      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne('/api/tickets/SS-2/activity');
      req.flush({ data: mockActivities });

      expect(service.loading()).toBeFalse();
      expect(service.activities().length).toBe(1);
      expect((service.activities()[0] as CommentActivity).body).toBe(
        'Loaded comment',
      );
    });

    it('should clear activities and loading on error', () => {
      service.loadActivity('SS-999');

      const req = httpMock.expectOne('/api/tickets/SS-999/activity');
      req.flush(null, { status: 500, statusText: 'Error' });

      expect(service.loading()).toBeFalse();
      expect(service.activities().length).toBe(0);
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CommentFormComponent } from './comment-form.component';
import { ActivityService } from '../activity.service';
import { CommentActivity } from '../activity.model';
import { of, EMPTY } from 'rxjs';
import { ComponentRef } from '@angular/core';

describe('CommentFormComponent', () => {
  let component: CommentFormComponent;
  let componentRef: ComponentRef<CommentFormComponent>;
  let fixture: ComponentFixture<CommentFormComponent>;
  let activityService: jasmine.SpyObj<ActivityService>;

  beforeEach(async () => {
    activityService = jasmine.createSpyObj('ActivityService', ['addComment']);

    await TestBed.configureTestingModule({
      imports: [CommentFormComponent, NoopAnimationsModule, MatSnackBarModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivityService, useValue: activityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentFormComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('ticketId', 'SS-1');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have disabled submit when textarea is empty', () => {
    expect(component.isSubmitDisabled).toBeTrue();
  });

  it('should have disabled submit when textarea is whitespace-only', () => {
    component.commentBody.set('   ');
    expect(component.isSubmitDisabled).toBeTrue();
  });

  it('should enable submit when textarea has content', () => {
    component.commentBody.set('Hello world');
    expect(component.isSubmitDisabled).toBeFalse();
  });

  it('should expand on focus', () => {
    expect(component.expanded()).toBeFalse();
    component.onFocus();
    expect(component.expanded()).toBeTrue();
  });

  it('should have an accessible textarea', () => {
    const textarea = fixture.nativeElement.querySelector('textarea');
    expect(textarea.getAttribute('aria-label')).toBe('Add a comment');
  });

  it('should call ActivityService.addComment on submit', () => {
    const mockComment: CommentActivity = {
      id: 1,
      type: 'comment',
      actorName: '_SYSTEM',
      actorType: 'human',
      timestamp: '2026-02-15T12:00:00Z',
      body: 'Test comment',
    };
    activityService.addComment.and.returnValue(of(mockComment));

    component.commentBody.set('Test comment');
    component.onSubmit();

    expect(activityService.addComment).toHaveBeenCalledWith('SS-1', 'Test comment');
  });

  it('should clear textarea after successful submit', () => {
    const mockComment: CommentActivity = {
      id: 1,
      type: 'comment',
      actorName: '_SYSTEM',
      actorType: 'human',
      timestamp: '2026-02-15T12:00:00Z',
      body: 'Test comment',
    };
    activityService.addComment.and.returnValue(of(mockComment));

    component.commentBody.set('Test comment');
    component.onSubmit();

    expect(component.commentBody()).toBe('');
    expect(component.submitting()).toBeFalse();
  });

  it('should not submit when body is empty', () => {
    component.commentBody.set('');
    component.onSubmit();
    expect(activityService.addComment).not.toHaveBeenCalled();
  });

  it('should not submit when body is whitespace-only', () => {
    component.commentBody.set('   ');
    component.onSubmit();
    expect(activityService.addComment).not.toHaveBeenCalled();
  });

  it('should emit commentAdded on successful submit', () => {
    const mockComment: CommentActivity = {
      id: 1,
      type: 'comment',
      actorName: '_SYSTEM',
      actorType: 'human',
      timestamp: '2026-02-15T12:00:00Z',
      body: 'Test comment',
    };
    activityService.addComment.and.returnValue(of(mockComment));

    let emitted: CommentActivity | undefined;
    component.commentAdded.subscribe((c: CommentActivity) => (emitted = c));

    component.commentBody.set('Test comment');
    component.onSubmit();

    expect(emitted).toEqual(mockComment);
  });

  it('should show submit button only when expanded', () => {
    expect(fixture.nativeElement.querySelector('button[mat-flat-button]')).toBeNull();

    component.onFocus();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button[mat-flat-button]')).toBeTruthy();
  });

  it('should preserve textarea content on error', () => {
    activityService.addComment.and.returnValue(EMPTY);

    component.commentBody.set('My comment');
    component.onSubmit();

    expect(component.commentBody()).toBe('My comment');
  });

  it('should reset submitting on error', () => {
    activityService.addComment.and.returnValue(EMPTY);

    component.commentBody.set('My comment');
    component.onSubmit();

    expect(component.submitting()).toBeFalse();
  });
});

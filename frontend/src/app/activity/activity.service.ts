import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, map, tap, catchError, EMPTY } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';
import { Activity, CommentActivity } from './activity.model';
import { ApiResponse } from '../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private loadSubscription: Subscription | null = null;

  private activitiesSignal = signal<Activity[]>([]);
  private loadingSignal = signal<boolean>(false);

  readonly activities = this.activitiesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  getActivity(ticketId: string): Observable<Activity[]> {
    return this.http
      .get<ApiResponse<Activity[]>>(`${environment.apiBaseUrl}/tickets/${ticketId}/activity`)
      .pipe(map((response) => response.data));
  }

  loadActivity(ticketId: string): void {
    this.loadSubscription?.unsubscribe();
    this.loadingSignal.set(true);
    this.activitiesSignal.set([]);

    this.loadSubscription = this.getActivity(ticketId).subscribe({
      next: (activities) => {
        this.activitiesSignal.set(activities);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.activitiesSignal.set([]);
        this.loadingSignal.set(false);
      },
    });
  }

  addComment(ticketId: string, body: string): Observable<CommentActivity> {
    const tempId = -Date.now();
    const tempComment: CommentActivity = {
      id: tempId,
      type: 'comment',
      actorName: 'You',
      actorType: 'human',
      timestamp: new Date().toISOString(),
      body,
    };

    // Optimistic: append immediately
    this.activitiesSignal.update((activities) => [...activities, tempComment]);

    return this.http
      .post<ApiResponse<CommentActivity>>(
        `${environment.apiBaseUrl}/tickets/${ticketId}/comments`,
        { body },
      )
      .pipe(
        map((response) => response.data),
        tap((serverComment) => {
          // Replace temp with server response
          this.activitiesSignal.update((activities) =>
            activities.map((a) => (a.id === tempId ? serverComment : a)),
          );
        }),
        catchError((err) => {
          // Remove temp comment on error
          this.activitiesSignal.update((activities) =>
            activities.filter((a) => a.id !== tempId),
          );
          const message = err?.error?.error?.message || 'Failed to add comment';
          this.snackBar.open(message, 'Dismiss', { duration: 5000 });
          return EMPTY;
        }),
      );
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Activity } from './activity.model';
import { ApiResponse } from '../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private http = inject(HttpClient);
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
}

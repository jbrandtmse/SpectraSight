import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';
import { Ticket, CreateTicketRequest, FilterState } from './ticket.model';
import { ApiListResponse, ApiResponse } from '../shared/models/api-response.model';
import { AuthService } from '../core/auth.service';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private auth = inject(AuthService);

  private ticketsSignal = signal<Ticket[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private selectedTicketIdSignal = signal<string | null>(null);
  private filterStateSignal = signal<FilterState>({});
  private searchDebounce$ = new Subject<string>();

  readonly tickets = this.ticketsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly selectedTicketId = this.selectedTicketIdSignal.asReadonly();
  readonly filterState = this.filterStateSignal.asReadonly();
  readonly selectedTicket = computed(() => {
    const id = this.selectedTicketIdSignal();
    return this.ticketsSignal().find((t) => t.id === id) ?? null;
  });

  constructor() {
    this.searchDebounce$.pipe(debounceTime(300)).subscribe((search) => {
      this.filterStateSignal.update((s) => ({ ...s, search: search || undefined }));
      this.loadTickets();
    });
  }

  setFilters(filters: FilterState): void {
    this.filterStateSignal.set(filters);
    this.loadTickets();
  }

  setSearch(search: string): void {
    this.searchDebounce$.next(search);
  }

  loadTickets(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const state = this.filterStateSignal();
    let params = new HttpParams()
      .set('pageSize', '100');

    if (state.sort) {
      params = params.set('sort', state.sort);
    } else {
      params = params.set('sort', '-updatedAt');
    }
    if (state.type?.length) {
      params = params.set('type', state.type.join(','));
    }
    if (state.status?.length) {
      params = params.set('status', state.status.join(','));
    }
    if (state.priority) {
      params = params.set('priority', state.priority);
    }
    if (state.assignee) {
      const assignee = state.assignee === 'me' ? this.auth.getUsername() : state.assignee;
      params = params.set('assignee', assignee);
    }
    if (state.search) {
      params = params.set('search', state.search);
    }
    if (state.project) {
      params = params.set('project', state.project);
    }

    this.http
      .get<ApiListResponse<Ticket>>(
        `${environment.apiBaseUrl}/tickets`,
        { params }
      )
      .subscribe({
        next: (response) => {
          this.ticketsSignal.set(response.data);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          this.errorSignal.set(err?.error?.error?.message || 'Failed to load tickets');
          this.loadingSignal.set(false);
        },
      });
  }

  getTicket(id: string): Observable<Ticket> {
    return this.http
      .get<ApiResponse<Ticket>>(`${environment.apiBaseUrl}/tickets/${id}`)
      .pipe(map((response) => response.data));
  }

  updateTicket(id: string, changes: Partial<Ticket>): void {
    const tickets = this.ticketsSignal();
    const index = tickets.findIndex((t) => t.id === id);
    if (index === -1) return;

    const snapshot = { ...tickets[index] };

    // Optimistic update
    const updated = [...tickets];
    updated[index] = { ...updated[index], ...changes };
    this.ticketsSignal.set(updated);

    this.http
      .put<ApiResponse<Ticket>>(
        `${environment.apiBaseUrl}/tickets/${id}`,
        changes
      )
      .subscribe({
        next: (response) => {
          const fresh = [...this.ticketsSignal()];
          const idx = fresh.findIndex((t) => t.id === id);
          if (idx !== -1) {
            fresh[idx] = response.data;
            this.ticketsSignal.set(fresh);
          }
          this.snackBar.open('Updated', '', { duration: 3000 });
        },
        error: (err) => {
          const reverted = [...this.ticketsSignal()];
          const idx = reverted.findIndex((t) => t.id === id);
          if (idx !== -1) {
            reverted[idx] = snapshot;
            this.ticketsSignal.set(reverted);
          }
          const message = err.error?.error?.message || 'Failed to update';
          this.snackBar
            .open(message, 'Retry', { duration: 0, panelClass: ['ss-error-snackbar'] })
            .onAction()
            .subscribe(() => this.updateTicket(id, changes));
        },
      });
  }

  updateTicketField(id: string, field: string, value: unknown): void {
    this.updateTicket(id, { [field]: value } as Partial<Ticket>);
  }

  createTicket(data: CreateTicketRequest): Observable<Ticket> {
    return this.http
      .post<ApiResponse<Ticket>>(`${environment.apiBaseUrl}/tickets`, data)
      .pipe(
        map((response) => {
          const ticket = response.data;
          this.ticketsSignal.update((tickets) => [ticket, ...tickets]);
          this.selectTicket(ticket.id);
          this.snackBar.open(`Ticket ${ticket.id} created`, '', { duration: 3000 });
          return ticket;
        })
      );
  }

  deleteTicket(id: string): void {
    this.http
      .delete(`${environment.apiBaseUrl}/tickets/${id}`)
      .subscribe({
        next: () => {
          this.ticketsSignal.update((tickets) => tickets.filter((t) => t.id !== id));
          this.selectTicket(null);
          this.snackBar.open('Ticket deleted', '', { duration: 3000 });
        },
        error: (err) => {
          const message = err.error?.error?.message || 'Failed to delete ticket';
          this.snackBar.open(message, 'Dismiss', { duration: 0, panelClass: ['ss-error-snackbar'] });
        },
      });
  }

  selectTicket(id: string | null): void {
    this.selectedTicketIdSignal.set(id);
  }

  refreshTickets(): void {
    this.loadTickets();
  }

  updateTicketInList(ticket: Ticket): void {
    this.ticketsSignal.update((tickets) => {
      const idx = tickets.findIndex((t) => t.id === ticket.id);
      if (idx === -1) return tickets;
      const updated = [...tickets];
      updated[idx] = ticket;
      return updated;
    });
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';
import { Ticket, CreateTicketRequest } from './ticket.model';
import { ApiListResponse, ApiResponse } from '../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  private ticketsSignal = signal<Ticket[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private selectedTicketIdSignal = signal<string | null>(null);

  readonly tickets = this.ticketsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly selectedTicketId = this.selectedTicketIdSignal.asReadonly();
  readonly selectedTicket = computed(() => {
    const id = this.selectedTicketIdSignal();
    return this.ticketsSignal().find((t) => t.id === id) ?? null;
  });

  loadTickets(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http
      .get<ApiListResponse<Ticket>>(
        `${environment.apiBaseUrl}/tickets`,
        { params: { sort: '-updatedAt', pageSize: '100' } }
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
}

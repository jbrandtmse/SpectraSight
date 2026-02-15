import { Component, ChangeDetectionStrategy, inject, signal, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TicketService } from '../ticket.service';
import { TicketRowComponent } from './ticket-row.component';
import { Ticket } from '../ticket.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, TicketRowComponent],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.scss',
})
export class TicketListComponent implements OnInit {
  ticketService = inject(TicketService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  @ViewChildren('rowRef', { read: ElementRef }) rowRefs!: QueryList<ElementRef>;

  focusedIndex = signal(0);
  skeletonRows = Array(8);

  tickets = this.ticketService.tickets;

  ngOnInit(): void {
    this.ticketService.loadTickets();
  }

  onTicketSelected(id: string): void {
    this.ticketService.selectTicket(id);
    const tickets = this.tickets();
    const idx = tickets.findIndex((t) => t.id === id);
    if (idx >= 0) this.focusedIndex.set(idx);
    this.router.navigate(['/tickets', id]);
  }

  onNewTicket(): void {
    this.snackBar.open('Coming soon (Story 1.6)', 'Dismiss', { duration: 3000 });
  }

  onKeydown(event: KeyboardEvent): void {
    const tickets = this.tickets();
    if (!tickets.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.update((i) => Math.min(i + 1, tickets.length - 1));
        this.scrollToFocusedRow();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update((i) => Math.max(i - 1, 0));
        this.scrollToFocusedRow();
        break;
      case 'Enter':
        event.preventDefault();
        const ticket = tickets[this.focusedIndex()];
        if (ticket) this.onTicketSelected(ticket.id);
        break;
      case 'Escape':
        event.preventDefault();
        this.ticketService.selectTicket(null);
        break;
    }
  }

  trackByTicketId(_index: number, ticket: Ticket): string {
    return ticket.id;
  }

  private scrollToFocusedRow(): void {
    const rows = this.rowRefs?.toArray();
    const row = rows?.[this.focusedIndex()];
    row?.nativeElement?.scrollIntoView?.({ block: 'nearest' });
  }
}

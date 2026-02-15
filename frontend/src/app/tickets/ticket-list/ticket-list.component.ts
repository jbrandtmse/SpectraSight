import { Component, ChangeDetectionStrategy, inject, signal, computed, output, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TicketService } from '../ticket.service';
import { TicketRowComponent } from './ticket-row.component';
import { Ticket } from '../ticket.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, TicketRowComponent],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.scss',
})
export class TicketListComponent {
  ticketService = inject(TicketService);
  private router = inject(Router);

  newTicketRequested = output<void>();
  sortChanged = output<string>();

  @ViewChildren('rowRef', { read: ElementRef }) rowRefs!: QueryList<ElementRef>;

  focusedIndex = signal(0);
  skeletonRows = Array(8);

  tickets = this.ticketService.tickets;

  readonly hasActiveFilters = computed(() => {
    const state = this.ticketService.filterState();
    return !!(state.type?.length || state.status?.length || state.priority || state.assignee || state.search);
  });

  readonly sortField = computed(() => {
    const sort = this.ticketService.filterState().sort || '-updatedAt';
    return sort.startsWith('-') ? sort.substring(1) : sort;
  });

  readonly sortDirection = computed(() => {
    const sort = this.ticketService.filterState().sort || '-updatedAt';
    return sort.startsWith('-') ? 'desc' : 'asc';
  });

  onTicketSelected(id: string): void {
    this.ticketService.selectTicket(id);
    const tickets = this.tickets();
    const idx = tickets.findIndex((t) => t.id === id);
    if (idx >= 0) this.focusedIndex.set(idx);
    this.router.navigate(['/tickets', id]);
  }

  onNewTicket(): void {
    this.newTicketRequested.emit();
  }

  onSortColumn(field: string): void {
    const currentSort = this.ticketService.filterState().sort || '-updatedAt';
    const currentField = currentSort.startsWith('-') ? currentSort.substring(1) : currentSort;
    const currentDir = currentSort.startsWith('-') ? 'desc' : 'asc';

    let newSort: string;
    if (currentField === field) {
      newSort = currentDir === 'asc' ? '-' + field : field;
    } else {
      newSort = field;
    }

    this.sortChanged.emit(newSort);
  }

  onClearFilters(): void {
    this.ticketService.setFilters({});
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

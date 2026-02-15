import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SplitPanelComponent } from './split-panel/split-panel.component';
import { TicketListComponent } from './ticket-list/ticket-list.component';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitPanelComponent, TicketListComponent],
  template: `
    <ss-split-panel>
      <app-ticket-list listPanel></app-ticket-list>
      <div detailPanel class="detail-placeholder">
        @if (ticketService.selectedTicket(); as ticket) {
          <h2>{{ ticket.title }}</h2>
          <p>Ticket detail view coming in Story 1.5</p>
        } @else {
          <p class="muted">Select a ticket from the list</p>
        }
      </div>
    </ss-split-panel>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .detail-placeholder {
      padding: var(--ss-xl);
    }
    .muted {
      color: var(--ss-text-secondary);
    }
    h2 {
      margin: 0 0 var(--ss-sm) 0;
      color: var(--ss-text-primary);
    }
  `],
})
export class TicketsPageComponent implements OnInit {
  ticketService = inject(TicketService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.ticketService.selectTicket(id);
      }
    });
  }
}

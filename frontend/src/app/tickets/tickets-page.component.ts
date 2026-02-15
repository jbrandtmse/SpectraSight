import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SplitPanelComponent } from './split-panel/split-panel.component';
import { TicketListComponent } from './ticket-list/ticket-list.component';
import { TicketDetailComponent } from './ticket-detail/ticket-detail.component';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitPanelComponent, TicketListComponent, TicketDetailComponent],
  template: `
    <ss-split-panel>
      <app-ticket-list listPanel></app-ticket-list>
      <div detailPanel class="detail-container">
        @if (ticketService.selectedTicket()) {
          <app-ticket-detail></app-ticket-detail>
        } @else {
          <div class="detail-placeholder">
            <p class="muted">Select a ticket from the list</p>
          </div>
        }
      </div>
    </ss-split-panel>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .detail-container {
      height: 100%;
    }
    .detail-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--ss-xl);
    }
    .muted {
      color: var(--ss-text-secondary);
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

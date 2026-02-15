import { Component, ChangeDetectionStrategy, inject, signal, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SplitPanelComponent } from './split-panel/split-panel.component';
import { TicketListComponent } from './ticket-list/ticket-list.component';
import { TicketDetailComponent } from './ticket-detail/ticket-detail.component';
import { TicketCreateComponent } from './ticket-create/ticket-create.component';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitPanelComponent, TicketListComponent, TicketDetailComponent, TicketCreateComponent],
  template: `
    <ss-split-panel>
      <app-ticket-list listPanel (newTicketRequested)="onNewTicket()"></app-ticket-list>
      <div detailPanel class="detail-container">
        @if (creating()) {
          <app-ticket-create
            (created)="onCreated()"
            (cancelled)="onCancelled()">
          </app-ticket-create>
        } @else if (ticketService.selectedTicket()) {
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

  creating = signal(false);

  @HostListener('document:keydown.control.n', ['$event'])
  onCtrlN(event: Event): void {
    event.preventDefault();
    this.creating.set(true);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.ticketService.selectTicket(id);
      }
    });
  }

  onNewTicket(): void {
    this.creating.set(true);
  }

  onCreated(): void {
    this.creating.set(false);
  }

  onCancelled(): void {
    this.creating.set(false);
  }
}

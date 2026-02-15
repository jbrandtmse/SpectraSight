import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ticket } from '../ticket.model';
import { TypeIconComponent } from '../../shared/type-icon/type-icon.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-ticket-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule, TypeIconComponent, StatusBadgeComponent, RelativeTimePipe],
  templateUrl: './ticket-row.component.html',
  styleUrl: './ticket-row.component.scss',
})
export class TicketRowComponent {
  ticket = input.required<Ticket>();
  selected = input(false);
  focused = input(false);

  ticketSelected = output<string>();

  onClick(): void {
    this.ticketSelected.emit(this.ticket().id);
  }
}

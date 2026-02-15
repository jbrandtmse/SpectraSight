import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { TicketStatus } from '../../tickets/ticket.model';

const STATUS_COLOR: Record<TicketStatus, string> = {
  'Open': 'var(--ss-status-open)',
  'In Progress': 'var(--ss-status-in-progress)',
  'Blocked': 'var(--ss-status-blocked)',
  'Complete': 'var(--ss-status-complete)',
};

@Component({
  selector: 'ss-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="ss-status-badge" [class.compact]="compact()" [attr.aria-label]="'Status: ' + status()">
      <span class="dot" [style.background-color]="color()"></span>
      <span class="label">{{ status() }}</span>
    </span>
  `,
  styles: [`
    .ss-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .dot {
      display: inline-block;
      border-radius: 50%;
      flex-shrink: 0;
      width: 8px;
      height: 8px;
    }

    .label {
      font-size: 13px;
      color: var(--ss-text-secondary);
    }

    .compact .dot {
      width: 6px;
      height: 6px;
    }

    .compact .label {
      font-size: 11px;
    }
  `],
})
export class StatusBadgeComponent {
  status = input.required<TicketStatus>();
  compact = input(true);

  color = computed(() => STATUS_COLOR[this.status()] ?? STATUS_COLOR['Open']);
}

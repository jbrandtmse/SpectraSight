import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Ticket } from '../../tickets/ticket.model';

@Component({
  selector: 'ss-hierarchy-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ticket().parent; as parent) {
      <nav class="breadcrumb" aria-label="Ticket hierarchy">
        <button class="ancestor" (click)="ancestorClicked.emit(parent.id)" type="button">
          {{ parent.title }}
        </button>
        <span class="chevron" aria-hidden="true">&gt;</span>
        <span class="current">{{ ticket().title }}</span>
      </nav>
    }
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      margin-bottom: var(--ss-sm);
      overflow: hidden;
    }

    .ancestor {
      all: unset;
      color: var(--ss-text-link, var(--ss-primary));
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: var(--ss-breadcrumb-max-width, 200px);
      font: inherit;
      font-size: 12px;
    }

    .ancestor:hover {
      text-decoration: underline;
    }

    .ancestor:focus-visible {
      outline: 2px solid var(--ss-primary);
      outline-offset: 2px;
      border-radius: 2px;
    }

    .chevron {
      color: var(--ss-text-secondary);
      flex-shrink: 0;
    }

    .current {
      color: var(--ss-text-secondary);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class HierarchyBreadcrumbComponent {
  ticket = input.required<Ticket>();
  ancestorClicked = output<string>();
}

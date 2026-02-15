import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TicketType } from '../../tickets/ticket.model';

const TYPE_CONFIG: Record<TicketType, { icon: string; colorVar: string }> = {
  bug: { icon: 'bug_report', colorVar: 'var(--ss-type-bug)' },
  task: { icon: 'check_box_outline_blank', colorVar: 'var(--ss-type-task)' },
  story: { icon: 'bookmark', colorVar: 'var(--ss-type-story)' },
  epic: { icon: 'bolt', colorVar: 'var(--ss-type-epic)' },
};

@Component({
  selector: 'ss-type-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <mat-icon
      [style.color]="config().colorVar"
      [style.font-size.px]="size()"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [attr.aria-label]="type()">
      {{ config().icon }}
    </mat-icon>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; }
    mat-icon { line-height: 1; }
  `],
})
export class TypeIconComponent {
  type = input.required<TicketType>();
  size = input(16);

  config = computed(() => TYPE_CONFIG[this.type()] ?? TYPE_CONFIG['task']);
}

import { Component, ChangeDetectionStrategy, input, inject, effect, untracked } from '@angular/core';
import { ActivityService } from '../activity.service';
import { Activity } from '../activity.model';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { TicketStatus } from '../../tickets/ticket.model';

@Component({
  selector: 'ss-activity-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, RelativeTimePipe],
  templateUrl: './activity-timeline.component.html',
  styleUrl: './activity-timeline.component.scss',
})
export class ActivityTimelineComponent {
  ticketId = input.required<string>();
  refreshTrigger = input(0);

  activityService = inject(ActivityService);

  constructor() {
    effect(() => {
      const id = this.ticketId();
      this.refreshTrigger(); // track changes
      if (id) {
        untracked(() => this.activityService.loadActivity(id));
      }
    });
  }

  asStatus(value: string): TicketStatus {
    return value as TicketStatus;
  }

  isStatusChange(activity: Activity): boolean {
    return activity.type === 'statusChange';
  }

  isAssignmentChange(activity: Activity): boolean {
    return activity.type === 'assignmentChange';
  }

  isCodeReferenceChange(activity: Activity): boolean {
    return activity.type === 'codeReferenceChange';
  }

  isComment(activity: Activity): boolean {
    return activity.type === 'comment';
  }

  getCodeRefDisplay(activity: Activity): string {
    if (activity.type !== 'codeReferenceChange') return '';
    return activity.methodName
      ? `${activity.className}.${activity.methodName}`
      : activity.className;
  }
}

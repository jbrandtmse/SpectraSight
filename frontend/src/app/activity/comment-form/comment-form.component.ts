import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ActivityService } from '../activity.service';
import { CommentActivity } from '../activity.model';

@Component({
  selector: 'ss-comment-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './comment-form.component.html',
  styleUrl: './comment-form.component.scss',
})
export class CommentFormComponent {
  ticketId = input.required<string>();
  commentAdded = output<CommentActivity>();

  private activityService = inject(ActivityService);
  private snackBar = inject(MatSnackBar);

  commentBody = signal('');
  submitting = signal(false);
  expanded = signal(false);

  get isSubmitDisabled(): boolean {
    return this.submitting() || this.commentBody().trim().length === 0;
  }

  onFocus(): void {
    this.expanded.set(true);
  }

  onSubmit(): void {
    const body = this.commentBody().trim();
    if (!body) return;

    this.submitting.set(true);
    this.activityService
      .addComment(this.ticketId(), body)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (comment) => {
          this.commentBody.set('');
          this.commentAdded.emit(comment);
          this.snackBar.open('Comment added', '', { duration: 3000 });
        },
      });
  }
}

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDeleteDialogData {
  ticketId: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Delete ticket?</h2>
    <mat-dialog-content>
      Are you sure you want to delete ticket {{ data.ticketId }}? This action cannot be undone.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDeleteDialogComponent {
  data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);
}

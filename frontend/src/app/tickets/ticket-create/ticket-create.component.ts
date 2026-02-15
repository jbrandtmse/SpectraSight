import { Component, ChangeDetectionStrategy, inject, output, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TicketService } from '../ticket.service';
import { TicketType, TicketStatus, TicketPriority } from '../ticket.model';
import { TypeIconComponent } from '../../shared/type-icon/type-icon.component';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TitleCasePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TypeIconComponent,
  ],
  templateUrl: './ticket-create.component.html',
  styleUrl: './ticket-create.component.scss',
})
export class TicketCreateComponent {
  private ticketService = inject(TicketService);
  private router = inject(Router);

  created = output<void>();
  cancelled = output<void>();

  submitting = signal(false);

  typeOptions: TicketType[] = ['bug', 'task', 'story', 'epic'];
  statusOptions: TicketStatus[] = ['Open', 'In Progress', 'Blocked', 'Complete'];
  priorityOptions: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];

  form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<TicketType | ''>('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<TicketStatus>('Open', { nonNullable: true }),
    priority: new FormControl<TicketPriority | ''>('', { nonNullable: true }),
    assignee: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();

    this.ticketService.createTicket({
      title: raw.title,
      type: raw.type as TicketType,
      ...(raw.status !== 'Open' ? { status: raw.status } : {}),
      ...(raw.priority ? { priority: raw.priority as TicketPriority } : {}),
      ...(raw.assignee ? { assignee: raw.assignee } : {}),
      ...(raw.description ? { description: raw.description } : {}),
    }).subscribe({
      next: (ticket) => {
        this.submitting.set(false);
        this.router.navigate(['/tickets', ticket.id]);
        this.created.emit();
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

import { Component, ChangeDetectionStrategy, inject, output, signal, input, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TitleCasePipe } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TicketService } from '../ticket.service';
import { Ticket, TicketType, TicketStatus, TicketPriority } from '../ticket.model';
import { TypeIconComponent } from '../../shared/type-icon/type-icon.component';

const HIERARCHY_RULES: Record<string, string[]> = {
  epic: ['story', 'bug'],
  story: ['task', 'bug'],
  task: ['bug'],
  bug: [],
};

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
    MatAutocompleteModule,
    TypeIconComponent,
  ],
  templateUrl: './ticket-create.component.html',
  styleUrl: './ticket-create.component.scss',
})
export class TicketCreateComponent implements OnInit {
  ticketService = inject(TicketService);
  private router = inject(Router);

  created = output<void>();
  cancelled = output<void>();

  prefillParentId = input<string | null>(null);

  private destroyRef = inject(DestroyRef);

  submitting = signal(false);
  parentSearch = signal('');
  selectedParent = signal<Ticket | null>(null);
  selectedType = signal<TicketType | ''>('');

  typeOptions: TicketType[] = ['bug', 'task', 'story', 'epic'];
  statusOptions: TicketStatus[] = ['Open', 'In Progress', 'Blocked', 'Complete'];
  priorityOptions: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];

  filteredParents = computed(() => {
    const search = this.parentSearch().toLowerCase();
    const tickets = this.ticketService.tickets();
    if (!search) return tickets.slice(0, 20);
    return tickets
      .filter((t) => t.title.toLowerCase().includes(search) || t.id.toLowerCase().includes(search))
      .slice(0, 20);
  });

  hierarchyWarning = computed(() => {
    const parent = this.selectedParent();
    const childType = this.selectedType();
    if (!parent || !childType) return '';
    const allowed = HIERARCHY_RULES[parent.type] ?? [];
    if (!allowed.includes(childType)) {
      return `${parent.type} cannot contain ${childType}`;
    }
    return '';
  });

  form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<TicketType | ''>('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<TicketStatus>('Open', { nonNullable: true }),
    priority: new FormControl<TicketPriority | ''>('', { nonNullable: true }),
    assignee: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    parentSearch: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.form.controls.type.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.selectedType.set(value));

    const prefill = this.prefillParentId();
    if (prefill) {
      const parent = this.ticketService.tickets().find((t) => t.id === prefill);
      if (parent) {
        this.selectedParent.set(parent);
        this.form.controls.parentSearch.setValue(parent.title);
      }
    }
  }

  onParentInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.parentSearch.set(value);
    if (!value) {
      this.selectedParent.set(null);
    }
  }

  onParentSelected(ticket: Ticket): void {
    this.selectedParent.set(ticket);
    this.form.controls.parentSearch.setValue(ticket.title);
  }

  clearParent(): void {
    this.selectedParent.set(null);
    this.form.controls.parentSearch.setValue('');
    this.parentSearch.set('');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const parent = this.selectedParent();

    this.ticketService.createTicket({
      title: raw.title,
      type: raw.type as TicketType,
      ...(raw.status !== 'Open' ? { status: raw.status } : {}),
      ...(raw.priority ? { priority: raw.priority as TicketPriority } : {}),
      ...(raw.assignee ? { assignee: raw.assignee } : {}),
      ...(raw.description ? { description: raw.description } : {}),
      ...(parent ? { parentId: parent.id } : {}),
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

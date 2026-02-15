import { Component, ChangeDetectionStrategy, inject, HostListener, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TicketService } from '../ticket.service';
import { Ticket } from '../ticket.model';
import { TypeIconComponent } from '../../shared/type-icon/type-icon.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { InlineEditComponent } from '../../shared/inline-edit/inline-edit.component';
import { FieldDropdownComponent } from '../../shared/field-dropdown/field-dropdown.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { HierarchyBreadcrumbComponent } from '../../shared/hierarchy-breadcrumb/hierarchy-breadcrumb.component';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { CodeReferenceFieldComponent } from '../../code-references/code-reference-field/code-reference-field.component';
import { CodeReference } from '../ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TypeIconComponent,
    StatusBadgeComponent,
    InlineEditComponent,
    FieldDropdownComponent,
    RelativeTimePipe,
    HierarchyBreadcrumbComponent,
    CodeReferenceFieldComponent,
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
})
export class TicketDetailComponent {
  ticketService = inject(TicketService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  addSubtaskRequested = output<string>();

  statusOptions = ['Open', 'In Progress', 'Blocked', 'Complete'];
  priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  severityOptions = ['Low', 'Medium', 'High', 'Critical'];

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    this.ticketService.selectTicket(null);
    this.router.navigate(['/tickets']);
  }

  private numericFields = new Set(['estimatedHours', 'actualHours', 'storyPoints']);

  onFieldChanged(field: string, value: unknown): void {
    const ticket = this.ticketService.selectedTicket();
    if (ticket) {
      let coerced = value;
      if (this.numericFields.has(field) && typeof value === 'string') {
        const parsed = parseFloat(value);
        coerced = isNaN(parsed) ? null : parsed;
      }
      this.ticketService.updateTicketField(ticket.id, field, coerced);
    }
  }

  onDelete(): void {
    const ticket = this.ticketService.selectedTicket();
    if (!ticket) return;

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: { ticketId: ticket.id },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.ticketService.deleteTicket(ticket.id);
        this.router.navigate(['/tickets']);
      }
    });
  }

  navigateToTicket(id: string): void {
    this.ticketService.selectTicket(id);
    this.router.navigate(['/tickets', id]);
  }

  onAddSubtask(): void {
    const ticket = this.ticketService.selectedTicket();
    if (ticket) {
      this.addSubtaskRequested.emit(ticket.id);
    }
  }

  onCodeReferenceAdded(_ref: CodeReference): void {
    this.reloadSelectedTicket();
  }

  onCodeReferenceRemoved(_refId: number): void {
    this.reloadSelectedTicket();
  }

  private reloadSelectedTicket(): void {
    const ticket = this.ticketService.selectedTicket();
    if (ticket) {
      this.ticketService.getTicket(ticket.id).subscribe((updated) => {
        this.ticketService.updateTicketInList(updated);
      });
    }
  }

  asAny(ticket: Ticket): Record<string, unknown> {
    return ticket as unknown as Record<string, unknown>;
  }
}

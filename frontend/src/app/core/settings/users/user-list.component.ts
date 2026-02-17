import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserMappingService } from './user-mapping.service';
import { UserMapping, CreateUserRequest } from './user-mapping.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  private userMappingService = inject(UserMappingService);
  private snackBar = inject(MatSnackBar);

  readonly users = this.userMappingService.users;
  readonly loading = this.userMappingService.loading;
  readonly error = this.userMappingService.error;

  showCreateForm = signal(false);
  editingUserId = signal<number | null>(null);

  // Create form fields
  createIrisUsername = signal('');
  createDisplayName = signal('');

  // Edit form fields
  editDisplayName = signal('');

  readonly displayedColumns = ['displayName', 'irisUsername', 'isActive', 'createdAt', 'actions'];

  readonly sortedUsers = computed(() => {
    const users = this.users();
    return [...users].sort((a, b) => a.displayName.localeCompare(b.displayName));
  });

  ngOnInit(): void {
    this.userMappingService.loadUsers();
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.editingUserId.set(null);
    this.createIrisUsername.set('');
    this.createDisplayName.set('');
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
  }

  saveCreate(): void {
    if (!this.createIrisUsername() || !this.createDisplayName()) return;

    const data: CreateUserRequest = {
      irisUsername: this.createIrisUsername(),
      displayName: this.createDisplayName(),
    };

    this.userMappingService.createUser(data).subscribe({
      next: () => this.showCreateForm.set(false),
      error: (err) => {
        const message = err?.error?.error?.message || 'Failed to create user';
        this.snackBar.open(message, 'Dismiss', { duration: 5000 });
      },
    });
  }

  startEdit(user: UserMapping): void {
    this.editingUserId.set(user.id);
    this.showCreateForm.set(false);
    this.editDisplayName.set(user.displayName);
  }

  cancelEdit(): void {
    this.editingUserId.set(null);
  }

  saveEdit(user: UserMapping): void {
    if (this.editDisplayName() === user.displayName) {
      this.editingUserId.set(null);
      return;
    }

    this.userMappingService.updateUser(user.id, { displayName: this.editDisplayName() }).subscribe({
      next: () => this.editingUserId.set(null),
      error: (err) => {
        const message = err?.error?.error?.message || 'Failed to update user';
        this.snackBar.open(message, 'Dismiss', { duration: 5000 });
      },
    });
  }

  onToggleActive(user: UserMapping, newValue: boolean): void {
    // Optimistic UI: mat-slide-toggle already shows new state visually.
    // On error, reload to revert the toggle to server state.
    this.userMappingService.updateUser(user.id, { isActive: newValue }).subscribe({
      error: (err) => {
        this.userMappingService.loadUsers();
        const message = err?.error?.error?.message || 'Failed to update user';
        this.snackBar.open(message, 'Dismiss', { duration: 5000 });
      },
    });
  }

  retry(): void {
    this.userMappingService.loadUsers();
  }

  deleteUser(user: UserMapping): void {
    if (!confirm(`Delete user "${user.displayName}"?`)) return;
    this.userMappingService.deleteUser(user.id).subscribe({
      error: (err) => {
        const message = err?.error?.error?.message || 'Cannot delete user assigned to tickets';
        this.snackBar.open(message, 'Dismiss', { duration: 5000 });
      },
    });
  }
}

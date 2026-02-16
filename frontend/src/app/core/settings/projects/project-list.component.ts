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
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectService } from './project.service';
import { Project, CreateProjectRequest, UpdateProjectRequest } from './project.model';

@Component({
  selector: 'app-project-list',
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
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss',
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);

  readonly projects = this.projectService.projects;
  readonly loading = this.projectService.loading;
  readonly error = this.projectService.error;

  showCreateForm = signal(false);
  editingProjectId = signal<number | null>(null);

  // Create form fields
  createName = signal('');
  createPrefix = signal('');
  createOwner = signal('');
  createPrefixError = signal('');

  // Edit form fields
  editName = signal('');
  editOwner = signal('');

  readonly displayedColumns = ['name', 'prefix', 'owner', 'ticketCount', 'createdAt', 'actions'];

  readonly sortedProjects = computed(() => {
    const projects = this.projects();
    return [...projects].sort((a, b) => {
      if (a.prefix === 'SS') return -1;
      if (b.prefix === 'SS') return 1;
      return a.prefix.localeCompare(b.prefix);
    });
  });

  ngOnInit(): void {
    this.projectService.loadProjects();
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.editingProjectId.set(null);
    this.createName.set('');
    this.createPrefix.set('');
    this.createOwner.set('');
    this.createPrefixError.set('');
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
  }

  onPrefixInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.toUpperCase();
    this.createPrefix.set(input.value);
    this.createPrefixError.set('');
  }

  validatePrefix(): void {
    const prefix = this.createPrefix();
    if (!prefix) {
      this.createPrefixError.set('Prefix is required');
      return;
    }
    if (!/^[A-Z]{2,10}$/.test(prefix)) {
      this.createPrefixError.set('Prefix must be 2-10 uppercase letters');
      return;
    }
    const existing = this.projects().find((p) => p.prefix === prefix);
    if (existing) {
      this.createPrefixError.set('Prefix already in use');
      return;
    }
    this.createPrefixError.set('');
  }

  saveCreate(): void {
    this.validatePrefix();
    if (this.createPrefixError() || !this.createName()) return;

    const data: CreateProjectRequest = {
      name: this.createName(),
      prefix: this.createPrefix(),
    };
    if (this.createOwner()) {
      data.owner = this.createOwner();
    }

    this.projectService.createProject(data).subscribe({
      next: () => this.showCreateForm.set(false),
      error: (err) => {
        const message = err?.error?.error?.message || 'Failed to create project';
        this.snackBar.open(message, 'Dismiss', { duration: 5000 });
      },
    });
  }

  startEdit(project: Project): void {
    this.editingProjectId.set(project.id);
    this.showCreateForm.set(false);
    this.editName.set(project.name);
    this.editOwner.set(project.owner || '');
  }

  cancelEdit(): void {
    this.editingProjectId.set(null);
  }

  saveEdit(project: Project): void {
    const data: UpdateProjectRequest = {};
    if (this.editName() !== project.name) data.name = this.editName();
    if (this.editOwner() !== (project.owner || '')) data.owner = this.editOwner();

    if (!Object.keys(data).length) {
      this.editingProjectId.set(null);
      return;
    }

    this.projectService.updateProject(project.id, data).subscribe({
      next: () => this.editingProjectId.set(null),
      error: (err) => {
        const message = err?.error?.error?.message || 'Failed to update project';
        this.snackBar.open(message, 'Dismiss', { duration: 5000 });
      },
    });
  }

  deleteProject(project: Project): void {
    if (!confirm(`Delete project "${project.name}" (${project.prefix})?`)) return;
    this.projectService.deleteProject(project.id).subscribe({
      error: (err) => {
        const message = err?.error?.error?.message || 'Failed to delete project';
        this.snackBar.open(message, 'Dismiss', { duration: 5000 });
      },
    });
  }

  isDefault(project: Project): boolean {
    return project.prefix === 'SS';
  }

  canDelete(project: Project): boolean {
    return !this.isDefault(project) && project.ticketCount === 0;
  }

  deleteTooltip(project: Project): string {
    if (this.isDefault(project)) return 'Cannot delete the default project';
    if (project.ticketCount > 0) return 'Cannot delete project with existing tickets';
    return 'Delete project';
  }
}

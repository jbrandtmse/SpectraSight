import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  output,
  input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FilterState } from '../../tickets/ticket.model';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ss-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
})
export class FilterBarComponent implements OnInit, OnDestroy {
  projects = input<{ name: string; prefix: string }[]>([]);
  assignees = input<string[]>([]);
  initialFilters = input<FilterState>({});

  filtersChanged = output<FilterState>();

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  searchText = signal('');
  selectedProject = signal('');
  selectedTypes = signal<string[]>([]);
  selectedStatuses = signal<string[]>([]);
  selectedPriority = signal('');
  selectedAssignee = signal('');
  currentSort = signal('');

  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  readonly typeOptions = ['bug', 'task', 'story', 'epic'];
  readonly statusOptions = ['Open', 'In Progress', 'Blocked', 'Complete'];
  readonly priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  readonly hasActiveFilters = computed(() => {
    return (
      this.selectedProject() !== '' ||
      this.selectedTypes().length > 0 ||
      this.selectedStatuses().length > 0 ||
      this.selectedPriority() !== '' ||
      this.selectedAssignee() !== '' ||
      this.searchText() !== ''
    );
  });

  readonly activeFilterChips = computed(() => {
    const chips: { label: string; category: string; value: string }[] = [];
    if (this.selectedProject()) {
      const proj = this.projects().find((p) => p.prefix === this.selectedProject());
      const label = proj ? `${proj.name} (${proj.prefix})` : this.selectedProject();
      chips.push({ label, category: 'project', value: this.selectedProject() });
    }
    for (const t of this.selectedTypes()) {
      chips.push({ label: t, category: 'type', value: t });
    }
    for (const s of this.selectedStatuses()) {
      chips.push({ label: s, category: 'status', value: s });
    }
    if (this.selectedPriority()) {
      chips.push({ label: this.selectedPriority(), category: 'priority', value: this.selectedPriority() });
    }
    if (this.selectedAssignee()) {
      chips.push({ label: this.selectedAssignee(), category: 'assignee', value: this.selectedAssignee() });
    }
    if (this.searchText()) {
      chips.push({ label: `"${this.searchText()}"`, category: 'search', value: this.searchText() });
    }
    return chips;
  });

  ngOnInit(): void {
    const initial = this.initialFilters();
    if (initial.project) this.selectedProject.set(initial.project);
    if (initial.type?.length) this.selectedTypes.set(initial.type);
    if (initial.status?.length) this.selectedStatuses.set(initial.status);
    if (initial.priority) this.selectedPriority.set(initial.priority);
    if (initial.assignee) this.selectedAssignee.set(initial.assignee);
    if (initial.search) this.searchText.set(initial.search);
    if (initial.sort) this.currentSort.set(initial.sort);

    this.searchInput$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe((text) => {
      this.searchText.set(text);
      this.emitFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  onProjectChange(prefix: string): void {
    this.selectedProject.set(prefix);
    this.emitFilters();
  }

  clearSearch(): void {
    this.searchText.set('');
    this.emitFilters();
  }

  onTypeToggle(type: string): void {
    this.selectedTypes.update((types) => {
      const idx = types.indexOf(type);
      if (idx >= 0) {
        return types.filter((t) => t !== type);
      }
      return [...types, type];
    });
    this.emitFilters();
  }

  isTypeSelected(type: string): boolean {
    return this.selectedTypes().includes(type);
  }

  onStatusToggle(status: string): void {
    this.selectedStatuses.update((statuses) => {
      const idx = statuses.indexOf(status);
      if (idx >= 0) {
        return statuses.filter((s) => s !== status);
      }
      return [...statuses, status];
    });
    this.emitFilters();
  }

  isStatusSelected(status: string): boolean {
    return this.selectedStatuses().includes(status);
  }

  onPriorityChange(priority: string): void {
    this.selectedPriority.set(priority);
    this.emitFilters();
  }

  onAssigneeChange(assignee: string): void {
    this.selectedAssignee.set(assignee);
    this.emitFilters();
  }

  removeFilter(chip: { category: string; value: string }): void {
    switch (chip.category) {
      case 'project':
        this.selectedProject.set('');
        break;
      case 'type':
        this.selectedTypes.update((t) => t.filter((v) => v !== chip.value));
        break;
      case 'status':
        this.selectedStatuses.update((s) => s.filter((v) => v !== chip.value));
        break;
      case 'priority':
        this.selectedPriority.set('');
        break;
      case 'assignee':
        this.selectedAssignee.set('');
        break;
      case 'search':
        this.searchText.set('');
        break;
    }
    this.emitFilters();
  }

  clearAll(): void {
    this.selectedProject.set('');
    this.searchText.set('');
    this.selectedTypes.set([]);
    this.selectedStatuses.set([]);
    this.selectedPriority.set('');
    this.selectedAssignee.set('');
    this.emitFilters();
  }

  focusSearch(): void {
    this.searchInputRef?.nativeElement?.focus();
  }

  setSort(sort: string, emit = true): void {
    this.currentSort.set(sort);
    if (emit) {
      this.emitFilters();
    }
  }

  private emitFilters(): void {
    const state: FilterState = {};
    if (this.selectedProject()) state.project = this.selectedProject();
    if (this.selectedTypes().length) state.type = this.selectedTypes();
    if (this.selectedStatuses().length) state.status = this.selectedStatuses();
    if (this.selectedPriority()) state.priority = this.selectedPriority();
    if (this.selectedAssignee()) state.assignee = this.selectedAssignee();
    if (this.searchText()) state.search = this.searchText();
    if (this.currentSort()) state.sort = this.currentSort();
    this.filtersChanged.emit(state);
  }
}

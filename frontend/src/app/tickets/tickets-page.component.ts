import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SplitPanelComponent } from './split-panel/split-panel.component';
import { TicketListComponent } from './ticket-list/ticket-list.component';
import { TicketDetailComponent } from './ticket-detail/ticket-detail.component';
import { TicketCreateComponent } from './ticket-create/ticket-create.component';
import { FilterBarComponent } from '../shared/filter-bar/filter-bar.component';
import { TicketService } from './ticket.service';
import { ProjectService } from '../core/settings/projects/project.service';
import { UserMappingService } from '../core/settings/users/user-mapping.service';
import { FilterState } from './ticket.model';

@Component({
  selector: 'app-tickets-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SplitPanelComponent, TicketListComponent, TicketDetailComponent, TicketCreateComponent, FilterBarComponent],
  template: `
    <ss-filter-bar
      [projects]="projectOptions()"
      [assignees]="distinctAssignees()"
      [initialFilters]="initialFilters()"
      (filtersChanged)="onFiltersChanged($event)">
    </ss-filter-bar>
    <ss-split-panel>
      <app-ticket-list listPanel (newTicketRequested)="onNewTicket()" (sortChanged)="onSortChanged($event)"></app-ticket-list>
      <div detailPanel class="detail-container">
        @if (creating()) {
          <app-ticket-create
            [prefillParentId]="creatingParentId()"
            (created)="onCreated()"
            (cancelled)="onCancelled()">
          </app-ticket-create>
        } @else if (ticketService.selectedTicket()) {
          <app-ticket-detail
            (addSubtaskRequested)="onAddSubtask($event)">
          </app-ticket-detail>
        } @else {
          <div class="detail-placeholder">
            <p class="muted">Select a ticket from the list</p>
          </div>
        }
      </div>
    </ss-split-panel>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .detail-container {
      height: 100%;
    }
    .detail-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--ss-xl);
    }
    .muted {
      color: var(--ss-text-secondary);
    }
    ss-split-panel {
      flex: 1;
      min-height: 0;
    }
  `],
})
export class TicketsPageComponent implements OnInit, OnDestroy {
  ticketService = inject(TicketService);
  private projectService = inject(ProjectService);
  private userMappingService = inject(UserMappingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  @ViewChild(FilterBarComponent) filterBar!: FilterBarComponent;

  creating = signal(false);
  creatingParentId = signal<string | null>(null);
  initialFilters = signal<FilterState>({});

  readonly projectOptions = computed(() => {
    return this.projectService.projects().map((p) => ({ name: p.name, prefix: p.prefix }));
  });

  readonly assigneeOptions = computed(() => this.userMappingService.activeUserNames());

  readonly distinctAssignees = computed(() => {
    const mapped = this.assigneeOptions();
    if (mapped.length) return mapped;
    const tickets = this.ticketService.tickets();
    const assignees = new Set<string>();
    for (const t of tickets) {
      if (t.assignee) assignees.add(t.assignee);
    }
    return Array.from(assignees).sort();
  });

  @HostListener('document:keydown.control.n', ['$event'])
  onCtrlN(event: Event): void {
    event.preventDefault();
    this.creatingParentId.set(null);
    this.creating.set(true);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === '/' && !this.isInputFocused()) {
      event.preventDefault();
      this.filterBar?.focusSearch();
    }
  }

  ngOnInit(): void {
    this.projectService.loadProjects();
    this.userMappingService.ensureLoaded();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.ticketService.selectTicket(id);
      }
    });

    // Read initial filters from query params
    const qp = this.route.snapshot.queryParamMap;
    const initial: FilterState = {};
    if (qp.get('project')) initial.project = qp.get('project')!;
    if (qp.get('type')) initial.type = qp.get('type')!.split(',');
    if (qp.get('status')) initial.status = qp.get('status')!.split(',');
    if (qp.get('priority')) initial.priority = qp.get('priority')!;
    if (qp.get('assignee')) initial.assignee = qp.get('assignee')!;
    if (qp.get('search')) initial.search = qp.get('search')!;
    if (qp.get('sort')) initial.sort = qp.get('sort')!;
    this.initialFilters.set(initial);

    // Always apply initial filters and load tickets. Even with empty filters,
    // this ensures a single load is triggered from the page orchestrator rather
    // than a redundant double-load when both the page and list component init.
    this.ticketService.setFilters(initial);

    // Subscribe to query param changes (browser back/forward)
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((qpm) => {
      const filters: FilterState = {};
      if (qpm.get('project')) filters.project = qpm.get('project')!;
      if (qpm.get('type')) filters.type = qpm.get('type')!.split(',');
      if (qpm.get('status')) filters.status = qpm.get('status')!.split(',');
      if (qpm.get('priority')) filters.priority = qpm.get('priority')!;
      if (qpm.get('assignee')) filters.assignee = qpm.get('assignee')!;
      if (qpm.get('search')) filters.search = qpm.get('search')!;
      if (qpm.get('sort')) filters.sort = qpm.get('sort')!;

      const currentState = this.ticketService.filterState();
      if (JSON.stringify(filters) !== JSON.stringify(currentState)) {
        this.initialFilters.set(filters);
        this.ticketService.setFilters(filters);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltersChanged(filters: FilterState): void {
    this.ticketService.setFilters(filters);
    this.syncFiltersToUrl(filters);
  }

  onSortChanged(sort: string): void {
    const current = this.ticketService.filterState();
    const updated = { ...current, sort };
    this.ticketService.setFilters(updated);
    this.filterBar?.setSort(sort, false);
    this.syncFiltersToUrl(updated);
  }

  onNewTicket(): void {
    this.creatingParentId.set(null);
    this.creating.set(true);
  }

  onAddSubtask(parentId: string): void {
    this.creatingParentId.set(parentId);
    this.creating.set(true);
  }

  onCreated(): void {
    this.creating.set(false);
    this.creatingParentId.set(null);
  }

  onCancelled(): void {
    this.creating.set(false);
    this.creatingParentId.set(null);
  }

  private syncFiltersToUrl(filters: FilterState): void {
    const queryParams: Record<string, string | null> = {
      project: filters.project || null,
      type: filters.type?.length ? filters.type.join(',') : null,
      status: filters.status?.length ? filters.status.join(',') : null,
      priority: filters.priority || null,
      assignee: filters.assignee || null,
      search: filters.search || null,
      sort: filters.sort || null,
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: false,
    });
  }

  private isInputFocused(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable;
  }
}

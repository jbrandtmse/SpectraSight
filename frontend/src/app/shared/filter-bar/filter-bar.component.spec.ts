import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FilterBarComponent } from './filter-bar.component';
import { FilterState } from '../../tickets/ticket.model';

describe('FilterBarComponent', () => {
  let component: FilterBarComponent;
  let fixture: ComponentFixture<FilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterBarComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have role="search" on the filter bar', () => {
    const filterBar = fixture.nativeElement.querySelector('[role="search"]');
    expect(filterBar).toBeTruthy();
  });

  it('should display type filter chips', () => {
    const chips = fixture.nativeElement.querySelectorAll('.filter-chip');
    // 4 type chips + 4 status chips = 8
    expect(chips.length).toBe(8);
  });

  it('should toggle type filter on chip click', () => {
    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.onTypeToggle('bug');
    expect(component.selectedTypes()).toEqual(['bug']);
    expect(emitted).toBeTruthy();
    expect(emitted!.type).toEqual(['bug']);
  });

  it('should remove type filter on second click', () => {
    component.onTypeToggle('bug');
    component.onTypeToggle('bug');
    expect(component.selectedTypes()).toEqual([]);
  });

  it('should support multiple type selections', () => {
    component.onTypeToggle('bug');
    component.onTypeToggle('task');
    expect(component.selectedTypes()).toEqual(['bug', 'task']);
  });

  it('should toggle status filter', () => {
    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.onStatusToggle('Open');
    expect(component.selectedStatuses()).toEqual(['Open']);
    expect(emitted!.status).toEqual(['Open']);
  });

  it('should support multiple status selections', () => {
    component.onStatusToggle('Open');
    component.onStatusToggle('Blocked');
    expect(component.selectedStatuses()).toEqual(['Open', 'Blocked']);
  });

  it('should set priority filter', () => {
    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.onPriorityChange('High');
    expect(component.selectedPriority()).toBe('High');
    expect(emitted!.priority).toBe('High');
  });

  it('should set assignee filter', () => {
    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.onAssigneeChange('alice');
    expect(component.selectedAssignee()).toBe('alice');
    expect(emitted!.assignee).toBe('alice');
  });

  it('should debounce search input', fakeAsync(() => {
    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.onSearchInput('test');
    expect(emitted).toBeNull(); // Not emitted yet

    tick(300);
    expect(emitted).toBeTruthy();
    expect(emitted!.search).toBe('test');
  }));

  it('should show active filter chips when filters are active', () => {
    component.onTypeToggle('bug');
    fixture.detectChanges();

    expect(component.hasActiveFilters()).toBeTrue();
    expect(component.activeFilterChips().length).toBe(1);
    expect(component.activeFilterChips()[0].label).toBe('bug');
  });

  it('should remove a specific filter via chip removal', () => {
    component.onTypeToggle('bug');
    component.onTypeToggle('task');
    expect(component.selectedTypes().length).toBe(2);

    component.removeFilter({ category: 'type', value: 'bug' });
    expect(component.selectedTypes()).toEqual(['task']);
  });

  it('should clear all filters', () => {
    component.onTypeToggle('bug');
    component.onStatusToggle('Open');
    component.onPriorityChange('High');
    component.onAssigneeChange('alice');

    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.clearAll();

    expect(component.selectedTypes()).toEqual([]);
    expect(component.selectedStatuses()).toEqual([]);
    expect(component.selectedPriority()).toBe('');
    expect(component.selectedAssignee()).toBe('');
    expect(component.hasActiveFilters()).toBeFalse();
    expect(emitted).toBeTruthy();
  });

  it('should clear search text', fakeAsync(() => {
    component.onSearchInput('test');
    tick(300);
    expect(component.searchText()).toBe('test');

    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.clearSearch();
    expect(component.searchText()).toBe('');
    expect(emitted).toBeTruthy();
  }));

  it('should initialize from initialFilters input', () => {
    // Create a new component with initial filters
    const fixture2 = TestBed.createComponent(FilterBarComponent);
    const comp2 = fixture2.componentInstance;
    fixture2.componentRef.setInput('initialFilters', {
      type: ['bug'],
      status: ['Open'],
      priority: 'High',
      assignee: 'alice',
      search: 'test',
      sort: '-title',
    });
    fixture2.detectChanges();

    expect(comp2.selectedTypes()).toEqual(['bug']);
    expect(comp2.selectedStatuses()).toEqual(['Open']);
    expect(comp2.selectedPriority()).toBe('High');
    expect(comp2.selectedAssignee()).toBe('alice');
    expect(comp2.searchText()).toBe('test');
    expect(comp2.currentSort()).toBe('-title');

    fixture2.destroy();
  });

  it('should not have active filters by default', () => {
    expect(component.hasActiveFilters()).toBeFalse();
    expect(component.activeFilterChips()).toEqual([]);
  });

  it('should include sort in emitted filter state', () => {
    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.setSort('-title');
    expect(emitted!.sort).toBe('-title');
  });

  it('should remove priority filter via chip', () => {
    component.onPriorityChange('High');
    component.removeFilter({ category: 'priority', value: 'High' });
    expect(component.selectedPriority()).toBe('');
  });

  it('should remove assignee filter via chip', () => {
    component.onAssigneeChange('alice');
    component.removeFilter({ category: 'assignee', value: 'alice' });
    expect(component.selectedAssignee()).toBe('');
  });

  it('should remove search filter via chip', fakeAsync(() => {
    component.onSearchInput('test');
    tick(300);
    component.removeFilter({ category: 'search', value: 'test' });
    expect(component.searchText()).toBe('');
  }));

  // Story 5.4: Project filter tests
  it('should set project filter on onProjectChange', () => {
    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.onProjectChange('DATA');
    expect(component.selectedProject()).toBe('DATA');
    expect(emitted).toBeTruthy();
    expect(emitted!.project).toBe('DATA');
  });

  it('should clear project filter when empty string is passed', () => {
    component.onProjectChange('DATA');
    expect(component.selectedProject()).toBe('DATA');

    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.onProjectChange('');
    expect(component.selectedProject()).toBe('');
    expect(emitted).toBeTruthy();
    expect(emitted!.project).toBeUndefined();
  });

  it('should initialize project from initialFilters', () => {
    const fixture2 = TestBed.createComponent(FilterBarComponent);
    const comp2 = fixture2.componentInstance;
    fixture2.componentRef.setInput('initialFilters', { project: 'DATA' });
    fixture2.detectChanges();

    expect(comp2.selectedProject()).toBe('DATA');

    fixture2.destroy();
  });

  it('should include project in hasActiveFilters', () => {
    expect(component.hasActiveFilters()).toBeFalse();
    component.onProjectChange('SS');
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should include project in activeFilterChips with name and prefix', () => {
    const fixture2 = TestBed.createComponent(FilterBarComponent);
    const comp2 = fixture2.componentInstance;
    fixture2.componentRef.setInput('projects', [
      { name: 'SpectraSight', prefix: 'SS' },
      { name: 'DataTools', prefix: 'DT' },
    ]);
    fixture2.detectChanges();

    comp2.onProjectChange('SS');
    const chips = comp2.activeFilterChips();
    expect(chips.length).toBe(1);
    expect(chips[0].category).toBe('project');
    expect(chips[0].label).toBe('SpectraSight (SS)');
    expect(chips[0].value).toBe('SS');

    fixture2.destroy();
  });

  it('should remove project filter via chip', () => {
    component.onProjectChange('DATA');
    expect(component.selectedProject()).toBe('DATA');

    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.removeFilter({ category: 'project', value: 'DATA' });
    expect(component.selectedProject()).toBe('');
    expect(emitted).toBeTruthy();
    expect(emitted!.project).toBeUndefined();
  });

  it('should clear project filter on clearAll', () => {
    component.onProjectChange('DATA');
    component.onTypeToggle('bug');
    expect(component.selectedProject()).toBe('DATA');

    let emitted: FilterState | null = null;
    component.filtersChanged.subscribe((f: FilterState) => emitted = f);

    component.clearAll();
    expect(component.selectedProject()).toBe('');
    expect(emitted).toBeTruthy();
    expect(emitted!.project).toBeUndefined();
  });
});

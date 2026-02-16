import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ProjectListComponent } from './project-list.component';
import { ProjectService } from './project.service';
import { Project } from './project.model';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let httpMock: HttpTestingController;

  const mockProjects: Project[] = [
    { id: 1, name: 'SpectraSight', prefix: 'SS', owner: 'admin', sequenceCounter: 10, ticketCount: 5, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 2, name: 'DataTools', prefix: 'DT', owner: '', sequenceCounter: 0, ticketCount: 0, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    { id: 3, name: 'Analytics', prefix: 'AN', owner: 'bob', sequenceCounter: 3, ticketCount: 2, createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushProjects(projects = mockProjects): void {
    const req = httpMock.expectOne(r => r.url.includes('/api/projects'));
    req.flush({ data: projects, total: projects.length, page: 1, pageSize: 100, totalPages: 1 });
  }

  it('should create', () => {
    fixture.detectChanges();
    flushProjects();
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    fixture.detectChanges();
    flushProjects();

    expect(component.projects().length).toBe(3);
  });

  it('should sort projects with SS first', () => {
    fixture.detectChanges();
    flushProjects();

    const sorted = component.sortedProjects();
    expect(sorted[0].prefix).toBe('SS');
    expect(sorted[1].prefix).toBe('AN');
    expect(sorted[2].prefix).toBe('DT');
  });

  it('should identify default project', () => {
    fixture.detectChanges();
    flushProjects();

    expect(component.isDefault(mockProjects[0])).toBeTrue();
    expect(component.isDefault(mockProjects[1])).toBeFalse();
  });

  it('should not allow deleting default project', () => {
    fixture.detectChanges();
    flushProjects();

    expect(component.canDelete(mockProjects[0])).toBeFalse();
    expect(component.deleteTooltip(mockProjects[0])).toBe('Cannot delete the default project');
  });

  it('should not allow deleting project with tickets', () => {
    fixture.detectChanges();
    flushProjects();

    expect(component.canDelete(mockProjects[2])).toBeFalse();
    expect(component.deleteTooltip(mockProjects[2])).toBe('Cannot delete project with existing tickets');
  });

  it('should allow deleting empty non-default project', () => {
    fixture.detectChanges();
    flushProjects();

    expect(component.canDelete(mockProjects[1])).toBeTrue();
    expect(component.deleteTooltip(mockProjects[1])).toBe('Delete project');
  });

  it('should toggle create form visibility', () => {
    fixture.detectChanges();
    flushProjects();

    expect(component.showCreateForm()).toBeFalse();
    component.openCreateForm();
    expect(component.showCreateForm()).toBeTrue();
    component.cancelCreate();
    expect(component.showCreateForm()).toBeFalse();
  });

  it('should validate prefix format', () => {
    fixture.detectChanges();
    flushProjects();

    component.createPrefix.set('a');
    component.validatePrefix();
    expect(component.createPrefixError()).toBeTruthy();

    component.createPrefix.set('TOOLONG12345');
    component.validatePrefix();
    expect(component.createPrefixError()).toBeTruthy();

    component.createPrefix.set('OK');
    component.validatePrefix();
    expect(component.createPrefixError()).toBe('');
  });

  it('should validate prefix uniqueness', () => {
    fixture.detectChanges();
    flushProjects();

    component.createPrefix.set('SS');
    component.validatePrefix();
    expect(component.createPrefixError()).toBe('Prefix already in use');
  });

  it('should toggle edit mode', () => {
    fixture.detectChanges();
    flushProjects();

    expect(component.editingProjectId()).toBeNull();
    component.startEdit(mockProjects[1]);
    expect(component.editingProjectId()).toBe(2);
    expect(component.editName()).toBe('DataTools');
    component.cancelEdit();
    expect(component.editingProjectId()).toBeNull();
  });

  it('should transform prefix input to uppercase', () => {
    fixture.detectChanges();
    flushProjects();

    const mockEvent = {
      target: { value: 'abc' },
    } as unknown as Event;

    component.onPrefixInput(mockEvent);
    expect(component.createPrefix()).toBe('ABC');
  });
});

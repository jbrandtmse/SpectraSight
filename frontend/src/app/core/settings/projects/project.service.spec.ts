import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectService } from './project.service';
import { Project } from './project.model';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockProject: Project = {
    id: 1,
    name: 'SpectraSight',
    prefix: 'SS',
    owner: 'admin',
    sequenceCounter: 10,
    ticketCount: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadProjects', () => {
    it('should load projects and set signal', () => {
      service.loadProjects();

      const req = httpMock.expectOne(r => r.url.includes('/api/projects'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockProject], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(service.projects().length).toBe(1);
      expect(service.projects()[0].prefix).toBe('SS');
      expect(service.loading()).toBeFalse();
    });

    it('should set loading to true while loading', () => {
      service.loadProjects();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(r => r.url.includes('/api/projects'));
      req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });

      expect(service.loading()).toBeFalse();
    });

    it('should set error on failure', () => {
      service.loadProjects();

      const req = httpMock.expectOne(r => r.url.includes('/api/projects'));
      req.flush({ error: { message: 'Server error' } }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBeFalse();
    });
  });

  describe('createProject', () => {
    it('should POST and reload projects on success', () => {
      service.createProject({ name: 'New', prefix: 'NW' }).subscribe();

      const createReq = httpMock.expectOne(r => r.url.includes('/api/projects') && r.method === 'POST');
      expect(createReq.request.body).toEqual({ name: 'New', prefix: 'NW' });
      createReq.flush({ data: { ...mockProject, id: 2, name: 'New', prefix: 'NW' } });

      // Reload triggered
      const reloadReq = httpMock.expectOne(r => r.url.includes('/api/projects') && r.method === 'GET');
      reloadReq.flush({ data: [mockProject, { ...mockProject, id: 2, name: 'New', prefix: 'NW' }], total: 2, page: 1, pageSize: 100, totalPages: 1 });

      expect(snackBarSpy.open).toHaveBeenCalledWith('Project created', '', { duration: 3000 });
    });
  });

  describe('updateProject', () => {
    it('should PUT and reload projects on success', () => {
      service.updateProject(1, { name: 'Updated' }).subscribe();

      const updateReq = httpMock.expectOne(r => r.url.includes('/api/projects/1') && r.method === 'PUT');
      expect(updateReq.request.body).toEqual({ name: 'Updated' });
      updateReq.flush({ data: { ...mockProject, name: 'Updated' } });

      // Reload triggered
      const reloadReq = httpMock.expectOne(r => r.url.includes('/api/projects') && r.method === 'GET');
      reloadReq.flush({ data: [{ ...mockProject, name: 'Updated' }], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(snackBarSpy.open).toHaveBeenCalledWith('Project updated', '', { duration: 3000 });
    });
  });

  describe('deleteProject', () => {
    it('should DELETE and reload projects on success', () => {
      service.deleteProject(2).subscribe();

      const deleteReq = httpMock.expectOne(r => r.url.includes('/api/projects/2') && r.method === 'DELETE');
      deleteReq.flush(null);

      // Reload triggered
      const reloadReq = httpMock.expectOne(r => r.url.includes('/api/projects') && r.method === 'GET');
      reloadReq.flush({ data: [mockProject], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(snackBarSpy.open).toHaveBeenCalledWith('Project deleted', '', { duration: 3000 });
    });
  });
});

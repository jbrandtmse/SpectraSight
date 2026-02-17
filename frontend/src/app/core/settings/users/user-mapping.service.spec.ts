import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserMappingService } from './user-mapping.service';
import { UserMapping } from './user-mapping.model';

describe('UserMappingService', () => {
  let service: UserMappingService;
  let httpMock: HttpTestingController;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockUser: UserMapping = {
    id: 1,
    irisUsername: '_SYSTEM',
    displayName: 'System Admin',
    isActive: true,
    createdAt: '2026-02-16T10:00:00Z',
    updatedAt: '2026-02-16T10:00:00Z',
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

    service = TestBed.inject(UserMappingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadUsers', () => {
    it('should load users and set signal', () => {
      service.loadUsers();

      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockUser], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(service.users().length).toBe(1);
      expect(service.users()[0].irisUsername).toBe('_SYSTEM');
      expect(service.loading()).toBeFalse();
    });

    it('should set loading to true while loading', () => {
      service.loadUsers();
      expect(service.loading()).toBeTrue();

      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });

      expect(service.loading()).toBeFalse();
    });

    it('should set error on failure', () => {
      service.loadUsers();

      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ error: { message: 'Server error' } }, { status: 500, statusText: 'Internal Server Error' });

      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBeFalse();
    });
  });

  describe('createUser', () => {
    it('should POST and reload users on success', () => {
      service.createUser({ irisUsername: 'bob', displayName: 'Bob' }).subscribe();

      const createReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'POST');
      expect(createReq.request.body).toEqual({ irisUsername: 'bob', displayName: 'Bob' });
      createReq.flush({ data: { ...mockUser, id: 2, irisUsername: 'bob', displayName: 'Bob' } });

      // Reload triggered
      const reloadReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'GET');
      reloadReq.flush({ data: [mockUser, { ...mockUser, id: 2, irisUsername: 'bob', displayName: 'Bob' }], total: 2, page: 1, pageSize: 100, totalPages: 1 });

      expect(snackBarSpy.open).toHaveBeenCalledWith('User created', '', { duration: 3000 });
    });
  });

  describe('updateUser', () => {
    it('should PUT and reload users on success', () => {
      service.updateUser(1, { displayName: 'Updated Name' }).subscribe();

      const updateReq = httpMock.expectOne(r => r.url.includes('/api/users/1') && r.method === 'PUT');
      expect(updateReq.request.body).toEqual({ displayName: 'Updated Name' });
      updateReq.flush({ data: { ...mockUser, displayName: 'Updated Name' } });

      // Reload triggered
      const reloadReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'GET');
      reloadReq.flush({ data: [{ ...mockUser, displayName: 'Updated Name' }], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(snackBarSpy.open).toHaveBeenCalledWith('User updated', '', { duration: 3000 });
    });

    it('should PUT isActive and reload users on success', () => {
      service.updateUser(1, { isActive: false }).subscribe();

      const updateReq = httpMock.expectOne(r => r.url.includes('/api/users/1') && r.method === 'PUT');
      expect(updateReq.request.body).toEqual({ isActive: false });
      updateReq.flush({ data: { ...mockUser, isActive: false } });

      // Reload triggered
      const reloadReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'GET');
      reloadReq.flush({ data: [{ ...mockUser, isActive: false }], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(snackBarSpy.open).toHaveBeenCalledWith('User updated', '', { duration: 3000 });
    });
  });

  describe('createUser error handling', () => {
    it('should propagate error to subscriber on failure', () => {
      let errorResponse: any;
      service.createUser({ irisUsername: '_SYSTEM', displayName: 'Duplicate' }).subscribe({
        error: (err) => { errorResponse = err; },
      });

      const createReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'POST');
      createReq.flush(
        { error: { message: 'IRIS username already exists' } },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorResponse).toBeTruthy();
      expect(errorResponse.status).toBe(400);
    });
  });

  // Story 6.3: activeUsers computed signal
  describe('activeUsers', () => {
    it('should filter to only active users', () => {
      const inactiveUser: UserMapping = { ...mockUser, id: 2, irisUsername: 'inactive', displayName: 'Inactive User', isActive: false };
      service.loadUsers();
      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ data: [mockUser, inactiveUser], total: 2, page: 1, pageSize: 100, totalPages: 1 });

      expect(service.activeUsers().length).toBe(1);
      expect(service.activeUsers()[0].displayName).toBe('System Admin');
    });

    it('should return empty array when no active users', () => {
      const inactiveUser: UserMapping = { ...mockUser, isActive: false };
      service.loadUsers();
      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ data: [inactiveUser], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(service.activeUsers().length).toBe(0);
    });
  });

  // Story 6.3: activeUserNames computed signal
  describe('activeUserNames', () => {
    it('should return display names of active users', () => {
      const user2: UserMapping = { ...mockUser, id: 2, irisUsername: 'bob', displayName: 'Bob', isActive: true };
      service.loadUsers();
      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ data: [mockUser, user2], total: 2, page: 1, pageSize: 100, totalPages: 1 });

      expect(service.activeUserNames()).toEqual(['System Admin', 'Bob']);
    });
  });

  // Story 6.3: ensureLoaded
  describe('ensureLoaded', () => {
    it('should call loadUsers if not yet loaded', () => {
      service.ensureLoaded();
      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
    });

    it('should not call loadUsers if already loaded', () => {
      service.loadUsers();
      const req1 = httpMock.expectOne(r => r.url.includes('/api/users'));
      req1.flush({ data: [mockUser], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      service.ensureLoaded();
      httpMock.expectNone(r => r.url.includes('/api/users'));
    });

    it('should not call loadUsers if currently loading', () => {
      service.loadUsers();
      service.ensureLoaded(); // Should not trigger another request
      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 });
    });
  });

  // Story 6.3: findByIrisUsername
  describe('findByIrisUsername', () => {
    it('should find user by IRIS username (case-insensitive)', () => {
      service.loadUsers();
      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ data: [mockUser], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(service.findByIrisUsername('_SYSTEM')?.displayName).toBe('System Admin');
      expect(service.findByIrisUsername('_system')?.displayName).toBe('System Admin');
    });

    it('should return undefined when no matching user', () => {
      service.loadUsers();
      const req = httpMock.expectOne(r => r.url.includes('/api/users'));
      req.flush({ data: [mockUser], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(service.findByIrisUsername('nonexistent')).toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('should DELETE and reload users on success', () => {
      service.deleteUser(2).subscribe();

      const deleteReq = httpMock.expectOne(r => r.url.includes('/api/users/2') && r.method === 'DELETE');
      deleteReq.flush(null);

      // Reload triggered
      const reloadReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'GET');
      reloadReq.flush({ data: [mockUser], total: 1, page: 1, pageSize: 100, totalPages: 1 });

      expect(snackBarSpy.open).toHaveBeenCalledWith('User deleted', '', { duration: 3000 });
    });

    it('should propagate 409 Conflict error to subscriber', () => {
      let errorResponse: any;
      service.deleteUser(1).subscribe({
        error: (err) => { errorResponse = err; },
      });

      const deleteReq = httpMock.expectOne(r => r.url.includes('/api/users/1') && r.method === 'DELETE');
      deleteReq.flush(
        { error: { message: 'Cannot delete user assigned to tickets' } },
        { status: 409, statusText: 'Conflict' }
      );

      expect(errorResponse).toBeTruthy();
      expect(errorResponse.status).toBe(409);
    });
  });
});

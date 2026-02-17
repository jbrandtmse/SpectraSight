import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { UserListComponent } from './user-list.component';
import { UserMapping } from './user-mapping.model';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let httpMock: HttpTestingController;

  const mockUsers: UserMapping[] = [
    { id: 1, irisUsername: '_SYSTEM', displayName: 'System Admin', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
    { id: 2, irisUsername: 'bob', displayName: 'Bob Smith', isActive: true, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    { id: 3, irisUsername: 'alice', displayName: 'Alice Jones', isActive: false, createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushUsers(users = mockUsers): void {
    const req = httpMock.expectOne(r => r.url.includes('/api/users'));
    req.flush({ data: users, total: users.length, page: 1, pageSize: 100, totalPages: 1 });
  }

  it('should create', () => {
    fixture.detectChanges();
    flushUsers();
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    fixture.detectChanges();
    flushUsers();

    expect(component.users().length).toBe(3);
  });

  it('should sort users alphabetically by displayName', () => {
    fixture.detectChanges();
    flushUsers();

    const sorted = component.sortedUsers();
    expect(sorted[0].displayName).toBe('Alice Jones');
    expect(sorted[1].displayName).toBe('Bob Smith');
    expect(sorted[2].displayName).toBe('System Admin');
  });

  it('should toggle create form visibility', () => {
    fixture.detectChanges();
    flushUsers();

    expect(component.showCreateForm()).toBeFalse();
    component.openCreateForm();
    expect(component.showCreateForm()).toBeTrue();
    component.cancelCreate();
    expect(component.showCreateForm()).toBeFalse();
  });

  it('should clear create form fields when opening', () => {
    fixture.detectChanges();
    flushUsers();

    component.createIrisUsername.set('leftover');
    component.createDisplayName.set('leftover');
    component.openCreateForm();

    expect(component.createIrisUsername()).toBe('');
    expect(component.createDisplayName()).toBe('');
  });

  it('should toggle edit mode', () => {
    fixture.detectChanges();
    flushUsers();

    expect(component.editingUserId()).toBeNull();
    component.startEdit(mockUsers[1]);
    expect(component.editingUserId()).toBe(2);
    expect(component.editDisplayName()).toBe('Bob Smith');
    component.cancelEdit();
    expect(component.editingUserId()).toBeNull();
  });

  it('should close create form when starting edit', () => {
    fixture.detectChanges();
    flushUsers();

    component.openCreateForm();
    expect(component.showCreateForm()).toBeTrue();
    component.startEdit(mockUsers[0]);
    expect(component.showCreateForm()).toBeFalse();
  });

  it('should not submit create form when fields are empty', () => {
    fixture.detectChanges();
    flushUsers();

    component.openCreateForm();
    component.saveCreate();
    // No HTTP request should be made
  });

  it('should cancel edit without saving when displayName unchanged', () => {
    fixture.detectChanges();
    flushUsers();

    component.startEdit(mockUsers[0]);
    component.saveEdit(mockUsers[0]);
    // No HTTP request should be made, editing should be cancelled
    expect(component.editingUserId()).toBeNull();
  });

  it('should display correct columns', () => {
    fixture.detectChanges();
    flushUsers();

    expect(component.displayedColumns).toEqual(['displayName', 'irisUsername', 'isActive', 'createdAt', 'actions']);
  });

  it('should call updateUser when toggling isActive', () => {
    fixture.detectChanges();
    flushUsers();

    component.onToggleActive(mockUsers[0], false);

    const req = httpMock.expectOne(r => r.url.includes('/api/users/1') && r.method === 'PUT');
    expect(req.request.body).toEqual({ isActive: false });
    req.flush({ data: { ...mockUsers[0], isActive: false } });

    // Reload triggered
    const reloadReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'GET');
    reloadReq.flush({ data: mockUsers, total: 3, page: 1, pageSize: 100, totalPages: 1 });
  });

  it('should reload users on toggle error to revert', () => {
    fixture.detectChanges();
    flushUsers();

    component.onToggleActive(mockUsers[0], false);

    const req = httpMock.expectOne(r => r.url.includes('/api/users/1') && r.method === 'PUT');
    req.flush({ error: { message: 'Server error' } }, { status: 500, statusText: 'Internal Server Error' });

    // Reload triggered to revert
    const reloadReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'GET');
    expect(reloadReq.request.method).toBe('GET');
    reloadReq.flush({ data: mockUsers, total: 3, page: 1, pageSize: 100, totalPages: 1 });
  });

  it('should delete user after confirmation', () => {
    fixture.detectChanges();
    flushUsers();

    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteUser(mockUsers[1]);

    const deleteReq = httpMock.expectOne(r => r.url.includes('/api/users/2') && r.method === 'DELETE');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    // Reload triggered
    const reloadReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'GET');
    reloadReq.flush({ data: [mockUsers[0], mockUsers[2]], total: 2, page: 1, pageSize: 100, totalPages: 1 });
  });

  it('should not delete user when confirmation is cancelled', () => {
    fixture.detectChanges();
    flushUsers();

    spyOn(window, 'confirm').and.returnValue(false);
    component.deleteUser(mockUsers[1]);
    expect(window.confirm).toHaveBeenCalled();
    // httpMock.verify() in afterEach confirms no HTTP request was made
  });

  it('should submit create form and reset on success', () => {
    fixture.detectChanges();
    flushUsers();

    component.openCreateForm();
    component.createIrisUsername.set('newuser');
    component.createDisplayName.set('New User');
    component.saveCreate();

    const createReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'POST');
    expect(createReq.request.body).toEqual({ irisUsername: 'newuser', displayName: 'New User' });
    createReq.flush({ data: { id: 4, irisUsername: 'newuser', displayName: 'New User', isActive: true, createdAt: '2026-02-16T00:00:00Z', updatedAt: '2026-02-16T00:00:00Z' } });

    // Reload triggered
    const reloadReq = httpMock.expectOne(r => r.url.includes('/api/users') && r.method === 'GET');
    reloadReq.flush({ data: mockUsers, total: 3, page: 1, pageSize: 100, totalPages: 1 });

    expect(component.showCreateForm()).toBeFalse();
  });
});

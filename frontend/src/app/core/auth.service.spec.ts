import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start as not authenticated', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should store credentials in sessionStorage on successful login', () => {
    service.login('admin', 'secret').subscribe((result) => {
      expect(result).toBeTrue();
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getUsername()).toBe('admin');
    });

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    expect(req.request.headers.get('Authorization')).toBe('Basic ' + btoa('admin:secret'));
    req.flush({ data: [], total: 0, page: 1, pageSize: 1, totalPages: 0 });
  });

  it('should clear credentials on failed login', () => {
    service.login('bad', 'creds').subscribe((result) => {
      expect(result).toBeFalse();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getUsername()).toBe('');
    });

    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.error(new ProgressEvent('error'), { status: 401 });
  });

  it('should generate correct Basic Auth header', () => {
    service.login('_SYSTEM', 'SYS').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({});

    expect(service.getAuthHeader()).toBe('Basic ' + btoa('_SYSTEM:SYS'));
  });

  it('should clear credentials on logout', () => {
    service.login('admin', 'pass').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({});

    expect(service.isAuthenticated()).toBeTrue();
    service.logout();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getUsername()).toBe('');
  });

  it('should persist credentials to sessionStorage not localStorage', () => {
    const localSpy = spyOn(localStorage, 'setItem');
    service.login('admin', 'pass').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({});

    expect(localSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('ss_user')).toBe('admin');
    expect(sessionStorage.getItem('ss_pass')).toBe('pass');
  });

  it('should restore session from sessionStorage on construction', () => {
    sessionStorage.setItem('ss_user', 'restored_user');
    sessionStorage.setItem('ss_pass', 'restored_pass');

    const freshService = TestBed.inject(AuthService);
    // Force re-construction by creating a new instance
    (freshService as any).username = '';
    (freshService as any).password = '';
    freshService.isLoggedIn.set(false);
    (freshService as any).restoreSession();

    expect(freshService.isAuthenticated()).toBeTrue();
    expect(freshService.getUsername()).toBe('restored_user');
    expect(freshService.getAuthHeader()).toBe('Basic ' + btoa('restored_user:restored_pass'));
  });

  it('should clear sessionStorage on logout', () => {
    service.login('admin', 'pass').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    req.flush({});

    expect(sessionStorage.getItem('ss_user')).toBe('admin');
    service.logout();
    expect(sessionStorage.getItem('ss_user')).toBeNull();
    expect(sessionStorage.getItem('ss_pass')).toBeNull();
  });
});

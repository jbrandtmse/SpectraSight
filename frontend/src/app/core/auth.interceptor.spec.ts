import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should not attach auth header when not authenticated', () => {
    httpClient.get('/api/tickets').subscribe();
    const req = httpMock.expectOne('/api/tickets');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should attach auth header to API requests when authenticated', () => {
    // Login first
    authService.login('user', 'pass').subscribe();
    const loginReq = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    loginReq.flush({});

    // Make an API request
    httpClient.get('/api/tickets').subscribe();
    const req = httpMock.expectOne('/api/tickets');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Basic ' + btoa('user:pass'));
    req.flush([]);
  });

  it('should not attach auth header to non-API requests when authenticated', () => {
    authService.login('user', 'pass').subscribe();
    const loginReq = httpMock.expectOne(r => r.url.includes('/api/tickets'));
    loginReq.flush({});

    httpClient.get('https://external.com/data').subscribe();
    const req = httpMock.expectOne('https://external.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });
});

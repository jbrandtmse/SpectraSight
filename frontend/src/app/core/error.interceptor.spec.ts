import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from './auth.service';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let snackBar: MatSnackBar;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    snackBar = TestBed.inject(MatSnackBar);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should show snackbar with API error message on error response', () => {
    const spy = spyOn(snackBar, 'open');
    httpClient.get('/api/tickets').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/tickets');
    req.flush(
      { error: { code: 'NOT_FOUND', message: 'Ticket not found', status: 404 } },
      { status: 404, statusText: 'Not Found' }
    );

    expect(spy).toHaveBeenCalledWith('Ticket not found', 'Dismiss', jasmine.objectContaining({ duration: 5000 }));
  });

  it('should call authService.logout on 401 error', fakeAsync(() => {
    const logoutSpy = spyOn(authService, 'logout');
    const snackSpy = spyOn(snackBar, 'open');

    httpClient.get('/api/tickets').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/tickets');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    tick();

    expect(logoutSpy).toHaveBeenCalled();
    expect(snackSpy).toHaveBeenCalledWith(
      'Authentication failed. Please log in again.',
      'Dismiss',
      jasmine.objectContaining({ duration: 5000 })
    );
  }));

  it('should show generic message when API error has no message', () => {
    const spy = spyOn(snackBar, 'open');
    httpClient.get('/api/tickets').subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne('/api/tickets');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(spy).toHaveBeenCalledWith('An unexpected error occurred', 'Dismiss', jasmine.any(Object));
  });

  it('should re-throw the error after handling', () => {
    let caughtError: HttpErrorResponse | null = null;
    httpClient.get('/api/tickets').subscribe({
      error: (err) => { caughtError = err; },
    });

    const req = httpMock.expectOne('/api/tickets');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(caughtError).toBeTruthy();
    expect(caughtError!.status).toBe(500);
  });
});

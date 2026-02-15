import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppComponent } from './app.component';
import { AuthService } from './core/auth.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should start with sidenav not collapsed', () => {
    expect(component.sidenavCollapsed()).toBeFalse();
  });

  it('should toggle sidenav collapsed state', () => {
    component.onToggleSidenav();
    expect(component.sidenavCollapsed()).toBeTrue();
    component.onToggleSidenav();
    expect(component.sidenavCollapsed()).toBeFalse();
  });

  it('should show router-outlet only when not authenticated', () => {
    fixture.detectChanges();
    // When not authenticated, only the plain router-outlet shows (no app-shell)
    const appShell = fixture.nativeElement.querySelector('.ss-app-container');
    expect(appShell).toBeFalsy();
  });

  it('should show app shell when authenticated', () => {
    authService.isLoggedIn.set(true);
    fixture.detectChanges();
    const appShell = fixture.nativeElement.querySelector('.ss-app-container');
    expect(appShell).toBeTruthy();
  });

  it('should include toolbar when authenticated', () => {
    authService.isLoggedIn.set(true);
    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector('app-toolbar');
    expect(toolbar).toBeTruthy();
  });

  it('should include sidenav when authenticated', () => {
    authService.isLoggedIn.set(true);
    fixture.detectChanges();
    const sidenav = fixture.nativeElement.querySelector('app-sidenav');
    expect(sidenav).toBeTruthy();
  });

  it('should navigate to /login on logout', () => {
    authService.isLoggedIn.set(true);
    component.onLogout();
    expect(authService.isAuthenticated()).toBeFalse();
  });
});

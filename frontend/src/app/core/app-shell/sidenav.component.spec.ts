import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SidenavComponent } from './sidenav.component';
import { UserMappingService } from '../settings/users/user-mapping.service';
import { AuthService } from '../auth.service';

describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let userMappingService: UserMappingService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    userMappingService = TestBed.inject(UserMappingService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushUsersRequest(users: any[] = []): void {
    const req = httpMock.expectOne(r => r.url.includes('/api/users'));
    req.flush({ data: users, total: users.length, page: 1, pageSize: 100, totalPages: users.length ? 1 : 0 });
  }

  it('should create', () => {
    fixture.detectChanges();
    flushUsersRequest();
    expect(component).toBeTruthy();
  });

  it('should have 4 navigation items', () => {
    fixture.detectChanges();
    flushUsersRequest();
    expect(component.navItems().length).toBe(4);
  });

  it('should include All Tickets nav item with /tickets route', () => {
    fixture.detectChanges();
    flushUsersRequest();
    const allTickets = component.navItems().find(i => i.label === 'All Tickets');
    expect(allTickets).toBeTruthy();
    expect(allTickets!.route).toBe('/tickets');
  });

  it('should include My Tickets nav item', () => {
    fixture.detectChanges();
    flushUsersRequest();
    const myTickets = component.navItems().find(i => i.label === 'My Tickets');
    expect(myTickets).toBeTruthy();
  });

  it('should include Epics nav item with type query param', () => {
    fixture.detectChanges();
    flushUsersRequest();
    const epics = component.navItems().find(i => i.label === 'Epics');
    expect(epics).toBeTruthy();
    expect(epics!.queryParams).toEqual({ type: 'epic' });
  });

  it('should include Settings nav item with /settings route', () => {
    fixture.detectChanges();
    flushUsersRequest();
    const settings = component.navItems().find(i => i.label === 'Settings');
    expect(settings).toBeTruthy();
    expect(settings!.route).toBe('/settings');
  });

  it('should render nav links in the DOM', () => {
    fixture.detectChanges();
    flushUsersRequest();
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('.ss-sidenav-item');
    expect(links.length).toBe(4);
  });

  it('should render the sidenav nav list', () => {
    fixture.detectChanges();
    flushUsersRequest();
    const nav = fixture.nativeElement.querySelector('.ss-sidenav');
    expect(nav).toBeTruthy();
  });

  // Story 6.3 AC#3: My Tickets resolves to display name when mapping exists
  it('should set My Tickets queryParams to display name when user mapping exists', () => {
    spyOn(authService, 'getUsername').and.returnValue('_SYSTEM');
    fixture.detectChanges();
    flushUsersRequest([
      { id: 1, irisUsername: '_SYSTEM', displayName: 'System Admin', isActive: true, createdAt: '', updatedAt: '' },
    ]);

    const myTickets = component.navItems().find(i => i.label === 'My Tickets');
    expect(myTickets).toBeTruthy();
    expect(myTickets!.queryParams).toEqual({ assignee: 'System Admin' });
    expect(myTickets!.action).toBeUndefined();
  });

  // Story 6.3 AC#4: My Tickets shows info message when no mapping exists
  it('should set My Tickets action when no user mapping exists', () => {
    spyOn(authService, 'getUsername').and.returnValue('_SYSTEM');
    fixture.detectChanges();
    flushUsersRequest([]);

    const myTickets = component.navItems().find(i => i.label === 'My Tickets');
    expect(myTickets).toBeTruthy();
    expect(myTickets!.queryParams).toBeUndefined();
    expect(myTickets!.action).toBeDefined();
  });

  // Story 6.3 AC#4: Clicking My Tickets with no mapping shows snackbar
  it('should show snackbar when My Tickets is clicked with no mapping', () => {
    spyOn(authService, 'getUsername').and.returnValue('_SYSTEM');
    const onActionSubject = { subscribe: jasmine.createSpy('subscribe') };
    snackBarSpy.open.and.returnValue({ onAction: () => onActionSubject } as any);
    fixture.detectChanges();
    flushUsersRequest([]);

    const myTickets = component.navItems().find(i => i.label === 'My Tickets');
    myTickets!.action!();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Set up your user mapping in Settings > Users',
      'Go to Settings',
      { duration: 5000 }
    );
  });

  // Story 6.3 AC#4: Snackbar "Go to Settings" action navigates to /settings
  it('should navigate to /settings when snackbar action is clicked', () => {
    spyOn(authService, 'getUsername').and.returnValue('_SYSTEM');
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    let actionCallback: () => void = () => {};
    const onActionSubject = { subscribe: (cb: () => void) => { actionCallback = cb; } };
    snackBarSpy.open.and.returnValue({ onAction: () => onActionSubject } as any);
    fixture.detectChanges();
    flushUsersRequest([]);

    const myTickets = component.navItems().find(i => i.label === 'My Tickets');
    myTickets!.action!();
    actionCallback();

    expect(navigateSpy).toHaveBeenCalledWith(['/settings']);
  });

  // Story 6.3 AC#3: Case-insensitive username matching
  it('should match IRIS username case-insensitively', () => {
    spyOn(authService, 'getUsername').and.returnValue('_system');
    fixture.detectChanges();
    flushUsersRequest([
      { id: 1, irisUsername: '_SYSTEM', displayName: 'System Admin', isActive: true, createdAt: '', updatedAt: '' },
    ]);

    expect(component.currentUserDisplayName()).toBe('System Admin');
  });

  it('should return null display name when username is empty', () => {
    spyOn(authService, 'getUsername').and.returnValue('');
    fixture.detectChanges();
    flushUsersRequest([]);

    expect(component.currentUserDisplayName()).toBeNull();
  });
});

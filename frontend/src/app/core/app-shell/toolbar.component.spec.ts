import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
      providers: [provideHttpClient(), provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a 48px toolbar', () => {
    const toolbar = fixture.nativeElement.querySelector('.ss-toolbar');
    expect(toolbar).toBeTruthy();
    const styles = getComputedStyle(toolbar);
    expect(styles.height).toBe('48px');
  });

  it('should display SpectraSight title', () => {
    const title = fixture.nativeElement.querySelector('.ss-toolbar-title');
    expect(title.textContent).toContain('SpectraSight');
  });

  it('should emit toggleSidenav when menu button is clicked', () => {
    let emitted = false;
    component.toggleSidenav.subscribe(() => (emitted = true));
    const menuButton = fixture.nativeElement.querySelector('button[mat-icon-button]');
    menuButton.click();
    expect(emitted).toBeTrue();
  });

  it('should emit toggleTheme when theme button is clicked', () => {
    let emitted = false;
    component.toggleTheme.subscribe(() => (emitted = true));
    const buttons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
    // Theme button is the second icon button
    buttons[1].click();
    expect(emitted).toBeTrue();
  });

  it('should emit logoutClicked when logout button is clicked', () => {
    let emitted = false;
    component.logoutClicked.subscribe(() => (emitted = true));
    const buttons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
    // Logout button is the third icon button
    buttons[2].click();
    expect(emitted).toBeTrue();
  });
});

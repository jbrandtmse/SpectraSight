import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    // Flush projects request from the ProjectListComponent in the Projects tab
    const projReqs = httpMock.match(r => r.url.includes('/api/projects'));
    projReqs.forEach(r => r.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }));
    expect(component).toBeTruthy();
  });

  it('should have tab group with General and Projects tabs', () => {
    fixture.detectChanges();
    const projReqs = httpMock.match(r => r.url.includes('/api/projects'));
    projReqs.forEach(r => r.flush({ data: [], total: 0, page: 1, pageSize: 100, totalPages: 0 }));
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('.mdc-tab');
    const tabLabels = Array.from(tabs).map((t: any) => t.textContent.trim());
    expect(tabLabels).toContain('General');
    expect(tabLabels).toContain('Projects');
  });
});

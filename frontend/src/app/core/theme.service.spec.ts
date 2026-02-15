import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-theme');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle from light to dark', () => {
    service.toggle();
    expect(service.isDark()).toBeTrue();
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
    expect(localStorage.getItem('ss-theme')).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    service.toggle(); // light -> dark
    service.toggle(); // dark -> light
    expect(service.isDark()).toBeFalse();
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
    expect(localStorage.getItem('ss-theme')).toBe('light');
  });

  it('should persist theme preference to localStorage', () => {
    service.toggle();
    expect(localStorage.getItem('ss-theme')).toBe('dark');
  });

  it('should restore theme from localStorage on init', () => {
    localStorage.setItem('ss-theme', 'dark');
    service.init();
    expect(service.isDark()).toBeTrue();
  });

  it('should add dark-theme class to body in dark mode', () => {
    service.toggle();
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
  });

  it('should remove dark-theme class from body in light mode', () => {
    service.toggle(); // dark
    service.toggle(); // light
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
  });
});

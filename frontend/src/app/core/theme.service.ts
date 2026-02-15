import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'ss-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (!localStorage.getItem(THEME_KEY)) {
            this.applyTheme(e.matches);
          }
        });
    }
  }

  init(): void {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
      this.applyTheme(stored === 'dark');
    } else if (typeof window !== 'undefined') {
      this.applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }

  toggle(): void {
    const newVal = !this.isDark();
    localStorage.setItem(THEME_KEY, newVal ? 'dark' : 'light');
    this.applyTheme(newVal);
  }

  private applyTheme(dark: boolean): void {
    this.isDark.set(dark);
    if (dark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}

import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule],
  template: `
    <mat-toolbar class="ss-toolbar">
      <button mat-icon-button (click)="toggleSidenav.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="ss-toolbar-title">SpectraSight</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="toggleTheme.emit()" [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
        <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
      <button mat-icon-button (click)="logoutClicked.emit()" aria-label="Logout">
        <mat-icon>logout</mat-icon>
      </button>
      <span class="ss-toolbar-username">{{ authService.getUsername() }}</span>
    </mat-toolbar>
  `,
  styles: [`
    .ss-toolbar {
      height: 48px;
      z-index: 10;
      background-color: var(--ss-surface-primary);
      color: var(--ss-text-primary);
      border-bottom: 1px solid var(--ss-border, #D4D4D4);
    }
    .ss-toolbar-title {
      font-weight: 600;
      font-size: 1.125rem;
      color: var(--ss-accent);
      margin-left: var(--ss-sm);
    }
    .spacer {
      flex: 1;
    }
    .ss-toolbar-username {
      font-size: 0.875rem;
      color: var(--ss-text-secondary);
      margin-left: var(--ss-xs);
    }
  `],
})
export class ToolbarComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  toggleSidenav = output<void>();
  toggleTheme = output<void>();
  logoutClicked = output<void>();
}

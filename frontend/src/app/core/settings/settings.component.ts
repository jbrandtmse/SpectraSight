import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule],
  template: `
    <div class="settings-container">
      <h2>Settings</h2>
      <mat-slide-toggle
        [checked]="themeService.isDark()"
        (change)="themeService.toggle()"
        labelPosition="before">
        Dark Mode
      </mat-slide-toggle>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: var(--ss-xl);
    }
    h2 {
      margin-bottom: var(--ss-lg);
      color: var(--ss-text-primary);
    }
  `],
})
export class SettingsComponent {
  themeService = inject(ThemeService);
}

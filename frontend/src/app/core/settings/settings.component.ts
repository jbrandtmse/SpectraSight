import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { ThemeService } from '../theme.service';
import { ProjectListComponent } from './projects/project-list.component';
import { UserListComponent } from './users/user-list.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, MatTabsModule, ProjectListComponent, UserListComponent],
  template: `
    <div class="settings-container">
      <h2>Settings</h2>
      <mat-tab-group>
        <mat-tab label="General">
          <div class="settings-tab-content">
            <mat-slide-toggle
              [checked]="themeService.isDark()"
              (change)="themeService.toggle()"
              labelPosition="before">
              Dark Mode
            </mat-slide-toggle>
          </div>
        </mat-tab>
        <mat-tab label="Projects">
          <div class="settings-tab-content">
            <app-project-list></app-project-list>
          </div>
        </mat-tab>
        <mat-tab label="Users">
          <div class="settings-tab-content">
            <app-user-list></app-user-list>
          </div>
        </mat-tab>
      </mat-tab-group>
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
    .settings-tab-content {
      padding: var(--ss-lg) 0;
    }
  `],
})
export class SettingsComponent {
  themeService = inject(ThemeService);
}

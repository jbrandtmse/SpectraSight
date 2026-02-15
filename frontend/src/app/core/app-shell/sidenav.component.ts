import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatListModule, MatIconModule],
  template: `
    <mat-nav-list class="ss-sidenav" [class.collapsed]="collapsed()">
      @for (item of navItems; track item.label) {
        <a mat-list-item
           [routerLink]="item.route"
           [queryParams]="item.queryParams"
           routerLinkActive="ss-sidenav-item-active"
           [routerLinkActiveOptions]="item.queryParams ? { exact: true } : { exact: false }"
           class="ss-sidenav-item">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          @if (!collapsed()) {
            <span matListItemTitle>{{ item.label }}</span>
          }
        </a>
      }
    </mat-nav-list>
  `,
  styles: [`
    .ss-sidenav {
      background-color: var(--ss-surface-secondary);
      height: 100%;
      width: 240px;
      transition: width 200ms ease;
      overflow-x: hidden;

      &.collapsed {
        width: 56px;
      }
    }

    .ss-sidenav-item {
      border-left: 3px solid transparent;
    }

    .ss-sidenav-item-active {
      border-left: 3px solid var(--ss-accent);
    }
  `],
})
export class SidenavComponent {
  collapsed = input(false);

  navItems: NavItem[] = [
    { label: 'All Tickets', icon: 'list', route: '/tickets' },
    { label: 'My Tickets', icon: 'person', route: '/tickets', queryParams: { assignee: 'me' } },
    { label: 'Epics', icon: 'bolt', route: '/tickets', queryParams: { type: 'epic' } },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];
}

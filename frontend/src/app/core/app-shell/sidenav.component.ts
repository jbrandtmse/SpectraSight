import { Component, ChangeDetectionStrategy, inject, input, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserMappingService } from '../settings/users/user-mapping.service';
import { AuthService } from '../auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
  action?: () => void;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatListModule, MatIconModule],
  template: `
    <mat-nav-list class="ss-sidenav">
      @for (item of navItems(); track item.label) {
        @if (item.action) {
          <a mat-list-item
             (click)="item.action()"
             class="ss-sidenav-item">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            @if (!collapsed()) {
              <span matListItemTitle>{{ item.label }}</span>
            }
          </a>
        } @else {
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
      }
    </mat-nav-list>
  `,
  host: {
    '[style.width]': 'collapsed() ? "56px" : "240px"',
    '[style.flex-shrink]': '"0"',
    '[style.transition]': '"width 200ms ease"',
    '[style.overflow]': '"hidden"',
  },
  styles: [`
    .ss-sidenav {
      background-color: var(--ss-surface-secondary);
      height: 100%;
      overflow-x: hidden;
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
  private userMappingService = inject(UserMappingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  collapsed = input(false);

  readonly currentUserDisplayName = computed(() => {
    const username = this.authService.getUsername();
    if (!username) return null;
    const mapping = this.userMappingService.findByIrisUsername(username);
    return mapping?.displayName ?? null;
  });

  readonly navItems = computed<NavItem[]>(() => {
    const displayName = this.currentUserDisplayName();
    const myTicketsItem: NavItem = displayName
      ? { label: 'My Tickets', icon: 'person', route: '/tickets', queryParams: { assignee: displayName } }
      : { label: 'My Tickets', icon: 'person', route: '/tickets', action: () => this.showNoMappingMessage() };

    return [
      { label: 'All Tickets', icon: 'list', route: '/tickets' },
      myTicketsItem,
      { label: 'Epics', icon: 'bolt', route: '/tickets', queryParams: { type: 'epic' } },
      { label: 'Settings', icon: 'settings', route: '/settings' },
    ];
  });

  constructor() {
    this.userMappingService.ensureLoaded();
  }

  private showNoMappingMessage(): void {
    this.snackBar.open('Set up your user mapping in Settings > Users', 'Go to Settings', { duration: 5000 })
      .onAction().subscribe(() => {
        this.router.navigate(['/settings']);
      });
  }
}

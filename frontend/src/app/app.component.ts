import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ToolbarComponent } from './core/app-shell/toolbar.component';
import { SidenavComponent } from './core/app-shell/sidenav.component';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { TicketService } from './tickets/ticket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, MatSidenavModule, ToolbarComponent, SidenavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private ticketService = inject(TicketService);

  sidenavCollapsed = signal(false);

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 1279px)'])
      .subscribe((result) => {
        this.sidenavCollapsed.set(result.matches);
      });
  }

  onToggleSidenav(): void {
    this.sidenavCollapsed.update((val) => !val);
  }

  onToggleTheme(): void {
    this.themeService.toggle();
  }

  async onNewTicket(): Promise<void> {
    await this.router.navigate(['/tickets']);
    this.ticketService.requestNewTicket();
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

import { Routes } from '@angular/router';
import { LoginComponent } from './core/login/login.component';
import { TicketsPageComponent } from './tickets/tickets-page.component';
import { SettingsComponent } from './core/settings/settings.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'tickets', component: TicketsPageComponent, canActivate: [authGuard] },
  { path: 'tickets/:id', component: TicketsPageComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/tickets', pathMatch: 'full' },
  { path: '**', redirectTo: '/tickets' },
];

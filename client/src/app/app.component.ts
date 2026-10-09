import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink],
  template: `
  @if (auth.user(); as u) {
    <header class="wrap row" style="padding-bottom:0">
      <h1>Stacks</h1>
      <nav class="row">
        <a routerLink="/dashboard">My shelf</a>
        @if (auth.isAdmin()) { <a routerLink="/admin">Manage members</a> }
        <button class="ghost" (click)="toggleTheme()">{{ dark ? 'Light mode' : 'Dark mode' }}</button>
        <button class="ghost" (click)="out()">Sign out {{ u.name }}</button>
      </nav>
    </header>
  }
  <router-outlet />`,
  styles: ['a{color:var(--signal);font-weight:600;text-decoration:none}']
})
export class AppComponent {
  auth = inject(AuthService); private router = inject(Router);
  dark = localStorage.getItem('theme') === 'dark';
  constructor() { document.documentElement.dataset['theme'] = this.dark ? 'dark' : 'light'; }
  toggleTheme() { this.dark = !this.dark; localStorage.setItem('theme', this.dark ? 'dark' : 'light'); document.documentElement.dataset['theme'] = this.dark ? 'dark' : 'light'; }
  out() { this.auth.logout(); this.router.navigate(['/login']); }
}

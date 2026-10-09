import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { User } from './models';

export const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  readonly user = signal<User | null>(null);
  readonly isAdmin = computed(() => this.user()?.role === 'Admin');
  get token() { return sessionStorage.getItem('token'); }

  login(body: { userId: string; password: string; role: string }): Observable<unknown> {
    return this.http.post<{ token: string; user: User }>(`${API}/auth/login`, body).pipe(
      tap(r => { sessionStorage.setItem('token', r.token); this.user.set(r.user); }));
  }
  logout() { sessionStorage.removeItem('token'); this.user.set(null); }

  /** Runs at app start (APP_INITIALIZER): restores the session before any route renders. */
  restoreSession(): Observable<unknown> {
    if (!this.token) return of(null);
    return this.http.get<User>(`${API}/auth/me`).pipe(
      tap(u => this.user.set(u)), catchError(() => { this.logout(); return of(null); }));
  }
}

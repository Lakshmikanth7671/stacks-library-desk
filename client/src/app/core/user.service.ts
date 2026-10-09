import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AppRecord, User } from './models';
import { API } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  /** Simulated server latency in ms, sent as ?delay= on every data call. */
  readonly delayMs = signal(0);
  private params() { return new HttpParams().set('delay', this.delayMs()); }

  profile() { return this.http.get<User>(`${API}/auth/me`, { params: this.params() }); }
  records() { return this.http.get<AppRecord[]>(`${API}/records`, { params: this.params() }); }
  list() { return this.http.get<User[]>(`${API}/users`, { params: this.params() }); }
  create(u: Partial<User>) { return this.http.post<User>(`${API}/users`, u, { params: this.params() }); }
  update(id: string, u: Partial<User>) { return this.http.put<User>(`${API}/users/${id}`, u, { params: this.params() }); }
  remove(id: string) { return this.http.delete<void>(`${API}/users/${id}`, { params: this.params() }); }
}

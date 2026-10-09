import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login', standalone: true, imports: [ReactiveFormsModule],
  template: `
  <main class="wrap" style="max-width:420px;padding-top:12vh">
    <h1>Stacks</h1>
    <p style="color:var(--muted)">Sign in to see which books and collections your role can open.</p>
    <form class="panel" [formGroup]="form" (ngSubmit)="submit()">
      <label>User ID <input formControlName="userId" autocomplete="username"></label>
      <label>Password <input type="password" formControlName="password" autocomplete="current-password"></label>
      <label>Role <select formControlName="role"><option>General User</option><option>Admin</option></select></label>
      @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
      <button [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in…' : 'Sign in' }}</button>
      <p style="color:var(--muted);font-size:13px">Demo: admin / admin123 (Admin), user1 / user123 (General User)</p>
    </form>
  </main>`
})
export class LoginComponent {
  private auth = inject(AuthService); private router = inject(Router);
  form = inject(FormBuilder).nonNullable.group({
    userId: ['', Validators.required], password: ['', Validators.required], role: ['General User', Validators.required] });
  loading = signal(false); error = signal('');
  submit() {
    this.loading.set(true); this.error.set('');
    this.auth.login(this.form.getRawValue()).pipe(finalize(() => this.loading.set(false)))
      .subscribe({ next: () => this.router.navigate(['/dashboard']), error: e => this.error.set(e.message) });
  }
}

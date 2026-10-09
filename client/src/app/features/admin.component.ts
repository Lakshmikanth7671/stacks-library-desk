import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { UserService } from '../core/user.service';
import { User } from '../core/models';

@Component({
  selector: 'app-admin', standalone: true, imports: [ReactiveFormsModule],
  template: `
  <main class="wrap">
    <form class="panel" [formGroup]="form" (ngSubmit)="save()">
      <h2>{{ editing() ? 'Edit ' + editing() : 'Add a member' }}</h2>
      <div class="grid">
        <label>User ID <input formControlName="id"></label>
        <label>Name <input formControlName="name"></label>
        <label>Email <input formControlName="email"></label>
        <label>Department <input formControlName="department"></label>
        <label>Password <input type="password" formControlName="password" [placeholder]="editing() ? 'Leave blank to keep' : ''"></label>
        <label>Role <select formControlName="role"><option>General User</option><option>Admin</option></select></label>
      </div>
      @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
      <p><button [disabled]="form.invalid || busy()">{{ busy() ? 'Saving…' : 'Save member' }}</button>
      @if (editing()) { <button type="button" class="ghost" (click)="reset()">Cancel</button> }</p>
    </form>
    <section class="panel">
      <h2>Members</h2>
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Role</th><th></th></tr></thead>
        <tbody>
        @if (loading()) { @for (i of [1,2,3]; track i) { <tr><td colspan="4"><div class="skeleton"></div></td></tr> } }
        @else { @for (u of users(); track u.id) {
          <tr><td>{{ u.id }}</td><td>{{ u.name }}</td><td><span class="badge" [class.admin]="u.role === 'Admin'">{{ u.role }}</span></td>
          <td><button class="ghost" (click)="edit(u)">Edit</button> <button class="danger" (click)="remove(u)">Delete</button></td></tr> } }
        </tbody>
      </table>
    </section>
  </main>`
})
export class AdminComponent implements OnInit {
  private svc = inject(UserService);
  users = signal<User[]>([]); loading = signal(true); busy = signal(false); error = signal(''); editing = signal('');
  form = inject(FormBuilder).nonNullable.group({
    id: ['', Validators.required], name: ['', Validators.required], email: [''], department: [''], password: [''], role: ['General User'] });
  ngOnInit() { this.refresh(); }
  refresh() { this.loading.set(true); this.svc.list().pipe(finalize(() => this.loading.set(false))).subscribe({ next: u => this.users.set(u), error: e => this.error.set(e.message) }); }
  edit(u: User) { this.editing.set(u.id); this.form.patchValue({ ...u, password: '' }); this.form.controls.id.disable(); }
  reset() { this.editing.set(''); this.form.reset({ role: 'General User' }); this.form.controls.id.enable(); this.error.set(''); }
  save() {
    this.busy.set(true); this.error.set('');
    const v = this.form.getRawValue() as Partial<User>; const id = this.editing();
    (id ? this.svc.update(id, v) : this.svc.create(v))
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({ next: () => { this.reset(); this.refresh(); }, error: e => this.error.set(e.message) });
  }
  remove(u: User) { if (confirm(`Delete ${u.name}?`)) this.svc.remove(u.id).subscribe({ next: () => this.refresh(), error: e => this.error.set(e.message) }); }
}

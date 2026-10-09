import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { UserService } from '../core/user.service';
import { AppRecord, User } from '../core/models';

@Component({
  selector: 'app-dashboard', standalone: true,
  template: `
  <main class="wrap">
    <section class="panel row">
      <div>
        <h2>Your library card</h2>
        @if (profile(); as p) {
          <p>{{ p.name }} · {{ p.email }} · {{ p.department }}
            <span class="badge" [class.admin]="p.role === 'Admin'">{{ p.role }}</span></p>
        } @else { <div class="skeleton" style="width:260px"></div> }
      </div>
      <label>Simulated catalogue delay
        <select (change)="setDelay($any($event.target).value)">
          <option value="0">None</option><option value="1500">1.5 s</option><option value="3000">3 s</option><option value="6000">6 s</option>
        </select>
      </label>
    </section>
    <section class="panel">
      <h2>Parallel calls</h2>
      <p>Library card <span>{{ profileMs() }} ms</span></p><div class="bar" [style.width.%]="pct(profileMs())"></div>
      <p>Catalogue <span>{{ recordsMs() }} ms</span></p><div class="bar alt" [style.width.%]="pct(recordsMs())"></div>
    </section>
    <section class="panel">
      <div class="row"><h2>Books you can borrow</h2><span>{{ status() }}</span></div>
      @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
      <table>
        <thead><tr><th>Title</th><th>Section</th><th>Clearance</th></tr></thead>
        <tbody>
        @if (loading()) { @for (i of [1,2,3]; track i) { <tr><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td><td><div class="skeleton"></div></td></tr> } }
        @else { @for (r of records(); track r.id) {
          <tr><td>{{ r.title }}</td><td>{{ r.category }}</td><td><span class="badge" [class.admin]="r.access === 'Admin'">{{ r.access }}</span></td></tr> } }
        </tbody>
      </table>
    </section>
  </main>`
})
export class DashboardComponent implements OnInit {
  private svc = inject(UserService);
  profile = signal<User | null>(null); records = signal<AppRecord[]>([]);
  profileMs = signal(0); recordsMs = signal(0);
  pct(ms: number) { return Math.max(2, Math.min(100, ms / Math.max(this.profileMs(), this.recordsMs(), 1) * 100)); }
  loading = signal(true); error = signal(''); status = signal('');
  ngOnInit() { this.load(); }
  setDelay(v: string) { this.svc.delayMs.set(+v); this.load(); }
  /** Profile and records are requested in parallel and render independently as each arrives. */
  load() {
    const t0 = performance.now(); this.loading.set(true); this.error.set(''); this.profile.set(null); this.profileMs.set(0); this.recordsMs.set(0);
    this.svc.profile().subscribe({ next: p => { this.profile.set(p); this.profileMs.set(Math.round(performance.now() - t0)); }, error: e => this.error.set(e.message) });
    this.svc.records().pipe(finalize(() => { this.loading.set(false); this.status.set(`Loaded in ${((performance.now() - t0) / 1000).toFixed(1)} s`); }))
      .subscribe({ next: r => { this.records.set(r); this.recordsMs.set(Math.round(performance.now() - t0)); }, error: e => this.error.set(e.message) });
  }
}

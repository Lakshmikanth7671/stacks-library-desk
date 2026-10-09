import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/http';
import { AuthService } from './core/auth.service';

export const appConfig: ApplicationConfig = { providers: [
  provideRouter(routes),
  provideHttpClient(withInterceptors([authInterceptor])),
  { provide: APP_INITIALIZER, multi: true, deps: [AuthService], useFactory: (a: AuthService) => () => a.restoreSession() },
] };

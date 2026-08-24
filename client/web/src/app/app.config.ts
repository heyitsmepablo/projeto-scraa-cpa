import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.p-dark',
        },
      },
      license:
        'eyJpZCI6IjU1NmUyZmZjLTE3MjgtNDJiZC1hMGY2LTA0MjJjYTlmNzUzOCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODQzMjA2NzAsImV4cCI6MTgxNTg1NjY3MH0.9fWoA0KmbQJfD376DL4am1-Y7i0-JYrV1CV_5vKRc8hRzBJXMDxctDyuJnMRYHty5nuSZ3VwGsLPr7ryZgusAA',
    }),
  ],
};

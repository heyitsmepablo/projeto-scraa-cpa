import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
        },
      },
      license:
        'eyJpZCI6IjU1NmUyZmZjLTE3MjgtNDJiZC1hMGY2LTA0MjJjYTlmNzUzOCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODQzMjA2NzAsImV4cCI6MTgxNTg1NjY3MH0.9fWoA0KmbQJfD376DL4am1-Y7i0-JYrV1CV_5vKRc8hRzBJXMDxctDyuJnMRYHty5nuSZ3VwGsLPr7ryZgusAA',
    }),
  ],
};

import { Injectable, signal } from '@angular/core';

export const THEME_STORAGE_KEY = 'pulsar_cpa_theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _isDarkMode = signal<boolean>(false);
  readonly isDarkMode = this._isDarkMode.asReadonly();

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') {
      this._isDarkMode.set(true);
    } else if (savedTheme === 'light') {
      this._isDarkMode.set(false);
    } else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
      this._isDarkMode.set(prefersDark);
    }

    this.applyTheme(this._isDarkMode());

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          this.setDarkMode(e.matches);
        }
      });
    }
  }

  toggleTheme(): void {
    const nextValue = !this._isDarkMode();
    this.setDarkMode(nextValue);
  }

  setDarkMode(isDark: boolean): void {
    this._isDarkMode.set(isDark);
    this.applyTheme(isDark);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    }
  }

  private applyTheme(isDark: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.classList.toggle('p-dark', isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }
}

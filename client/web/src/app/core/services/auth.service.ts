import { Injectable, signal, computed } from '@angular/core';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentUserSignal = signal<UserSession | null>({
    id: 'usr-1',
    name: 'Auditor Fiscal CPA',
    email: 'auditor.cpa@saude.gov.br',
    role: 'AUDITOR',
  });

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(email: string, role: string = 'AUDITOR'): void {
    this.currentUserSignal.set({
      id: 'usr-' + Date.now(),
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
    });
  }

  logout(): void {
    this.currentUserSignal.set(null);
  }
}

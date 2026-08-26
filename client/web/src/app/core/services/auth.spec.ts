import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial authenticated state', () => {
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('auditor.cpa@saude.gov.br');
  });

  it('should logout user and clear session', () => {
    service.logout();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should login user and update state', () => {
    service.login('admin@cpa.saude.gov.br', 'ADMIN');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('admin@cpa.saude.gov.br');
    expect(service.currentUser()?.name).toBe('ADMIN');
    expect(service.currentUser()?.role).toBe('ADMIN');
  });
});

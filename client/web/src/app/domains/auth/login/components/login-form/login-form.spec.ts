import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  let component: LoginForm;
  let fixture: ComponentFixture<LoginForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginForm],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials', () => {
    expect(component.loginModel()).toEqual({
      email: '',
      password: '',
    });
  });

  it('should emit submitEvent when onSubmit is triggered', () => {
    const emitSpy = vi.spyOn(component.submitEvent, 'emit');
    component.onSubmit();
    expect(emitSpy).toHaveBeenCalled();
  });
});

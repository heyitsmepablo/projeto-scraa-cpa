import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginFormComponent } from './login-form.component';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginFormComponent);
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

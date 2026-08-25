import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputPasswordModule } from 'primeng/inputpassword';
import { form, FormField } from '@angular/forms/signals';
import { LoginFormModel } from './login-form.model';

@Component({
  selector: 'app-login-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, InputTextModule, InputPasswordModule, FormField],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
})
export class LoginFormComponent {
  loginModel = signal<LoginFormModel>({
    email: '',
    password: '',
  });

  loginForm = form(this.loginModel);

  submitEvent = output<LoginFormModel>();

  onSubmit() {
    this.submitEvent.emit(this.loginForm().value());
  }
}

export { LoginFormComponent as LoginForm };

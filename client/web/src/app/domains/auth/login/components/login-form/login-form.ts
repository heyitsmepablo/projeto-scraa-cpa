import { Component, output, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputPasswordModule } from 'primeng/inputpassword';
import { form, FormField } from '@angular/forms/signals';

export interface LoginFormModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-form',
  imports: [ButtonDirective, InputTextModule, InputPasswordModule, FormField],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
})
export class LoginForm {
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

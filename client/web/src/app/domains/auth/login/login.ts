import { Component, signal } from '@angular/core';
import { LoginFormModel, LoginForm } from './components/login-form/login-form';

@Component({
  selector: 'app-login',
  imports: [LoginForm],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  protected onLoginSubmit(credentials: LoginFormModel) {
    console.log(credentials);
  }
}

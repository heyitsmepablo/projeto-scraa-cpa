import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormModel } from './components/login-form/login-form.model';
import { LoginFormComponent } from './components/login-form/login-form';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoginFormComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  onLoginSubmit(credentials: LoginFormModel) {
    console.log(credentials);
  }
}

export { LoginComponent as Login };

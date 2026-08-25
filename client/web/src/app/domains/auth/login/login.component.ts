import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormModel } from './components/login-form/login-form.model';
import { LoginFormComponent } from './components/login-form/login-form.component';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoginFormComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  onLoginSubmit(credentials: LoginFormModel) {
    console.log(credentials);
  }
}

export { LoginComponent as Login };

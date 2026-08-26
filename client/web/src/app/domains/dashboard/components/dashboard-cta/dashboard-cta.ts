import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-cta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-cta.html',
  styleUrl: './dashboard-cta.css',
})
export class DashboardCtaComponent {}

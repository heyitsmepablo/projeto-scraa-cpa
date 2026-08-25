import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TagModule, ButtonModule, TooltipModule],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css',
})
export class DashboardHeaderComponent {
  readonly periodoFormatado = input<string>('');
  readonly periodMode = input<string>('SPECIFIC');

  readonly previousCompetence = output<void>();
  readonly nextCompetence = output<void>();
}

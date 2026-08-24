import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CompetenceService } from '../../../../core/services/competence.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, TagModule, TooltipModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  readonly competenceService = inject(CompetenceService);
  readonly themeService = inject(ThemeService);
  readonly toggleSidebar = output<void>();

  onCompetenciaChange(value: string): void {
    if (value) {
      this.competenceService.setCompetence(value);
    }
  }
}

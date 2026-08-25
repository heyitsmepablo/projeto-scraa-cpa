import { Component, inject, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { CompetenceService } from '../../../../core/services/competence.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { PeriodMode } from '../../../../core/models/competence.model';

export interface RangePreset {
  label: string;
  sublabel: string;
  inicio: string;
  fim: string;
  meses: number;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    TagModule,
    TooltipModule,
    SelectButtonModule,
    BadgeModule,
    PopoverModule,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  readonly competenceService = inject(CompetenceService);
  readonly themeService = inject(ThemeService);
  readonly toggleSidebar = output<void>();

  // Estado local do Popover de Seleção Temporal
  readonly activeMode = signal<PeriodMode>('SPECIFIC');
  readonly selectedSpecificComp = signal<string>('202401');
  readonly customInicio = signal<string>('202401');
  readonly customFim = signal<string>('202404');

  readonly modeOptions = [
    { label: 'Mês Específico', value: 'SPECIFIC', icon: 'pi pi-calendar' },
    { label: 'Recorte Temporal', value: 'RANGE', icon: 'pi pi-sliders-h' },
    { label: 'Vigência Global', value: 'GLOBAL', icon: 'pi pi-globe' },
  ];

  readonly rangePresets: RangePreset[] = [
    {
      label: '1º Quadrimestre 2024',
      sublabel: 'Jan/2024 a Abr/2024',
      inicio: '202401',
      fim: '202404',
      meses: 4,
    },
    {
      label: '2º Quadrimestre 2024',
      sublabel: 'Mai/2024 a Ago/2024',
      inicio: '202405',
      fim: '202408',
      meses: 4,
    },
    {
      label: '3º Quadrimestre 2024',
      sublabel: 'Set/2024 a Dez/2024',
      inicio: '202409',
      fim: '202412',
      meses: 4,
    },
    {
      label: '1º Semestre 2024',
      sublabel: 'Jan/2024 a Jun/2024',
      inicio: '202401',
      fim: '202406',
      meses: 6,
    },
    {
      label: 'Ano 2024 Completo',
      sublabel: 'Jan/2024 a Dez/2024',
      inicio: '202401',
      fim: '202412',
      meses: 12,
    },
    {
      label: 'Ano 2023 Completo',
      sublabel: 'Jan/2023 a Dez/2023',
      inicio: '202301',
      fim: '202312',
      meses: 12,
    },
  ];

  constructor() {
    effect(() => {
      const current = this.competenceService.periodFilter();
      this.activeMode.set(current.mode);
      if (current.competencia) {
        this.selectedSpecificComp.set(current.competencia);
      }
      if (current.competenciaInicio) {
        this.customInicio.set(current.competenciaInicio);
      }
      if (current.competenciaFim) {
        this.customFim.set(current.competenciaFim);
      }
    });
  }

  onCompetenciaChange(value: string): void {
    if (value) {
      this.competenceService.setCompetence(value);
    }
  }

  applySpecific(popover: any): void {
    const comp = this.selectedSpecificComp();
    if (comp) {
      this.competenceService.setSpecificCompetence(comp);
      popover.hide();
    }
  }

  applyPreset(preset: RangePreset, popover: any): void {
    this.competenceService.setRange(preset.inicio, preset.fim);
    popover.hide();
  }

  applyCustomRange(popover: any): void {
    const start = this.customInicio();
    const end = this.customFim();
    if (start && end) {
      this.competenceService.setRange(start, end);
      popover.hide();
    }
  }

  applyGlobal(popover: any): void {
    this.competenceService.setGlobal('202301', '202612');
    popover.hide();
  }

  getModeSeverity(mode: PeriodMode): 'info' | 'warn' | 'success' | 'secondary' {
    switch (mode) {
      case 'SPECIFIC':
        return 'info';
      case 'RANGE':
        return 'warn';
      case 'GLOBAL':
        return 'success';
      default:
        return 'secondary';
    }
  }

  getModeLabel(mode: PeriodMode): string {
    switch (mode) {
      case 'SPECIFIC':
        return 'Mês';
      case 'RANGE':
        return 'Recorte';
      case 'GLOBAL':
        return 'Global';
      default:
        return mode;
    }
  }
}

export { TopbarComponent as Topbar };

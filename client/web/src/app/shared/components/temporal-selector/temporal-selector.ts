import { Component, inject, linkedSignal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { DatePickerModule } from 'primeng/datepicker';
import { CompetenceService } from '../../../core/services/competence/competence';
import { PeriodMode } from '../../../core/models/competence.model';

@Component({
  selector: 'app-temporal-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SelectButtonModule,
    BadgeModule,
    PopoverModule,
    DatePickerModule,
  ],
  templateUrl: './temporal-selector.html',
  styleUrl: './temporal-selector.css',
})
export class TemporalSelectorComponent {
  readonly competenceService = inject(CompetenceService);

  // Estado local do Popover de Seleção Temporal sincronizado reativamente via linkedSignal
  readonly activeMode = linkedSignal<PeriodMode>(() => this.competenceService.periodFilter().mode);
  readonly selectedSpecificDate = linkedSignal<Date | null>(() => {
    const comp = this.competenceService.periodFilter().competencia;
    return comp ? this.competenceToDate(comp) : new Date(2024, 2, 1);
  });
  readonly rangeStartDate = linkedSignal<Date | null>(() => {
    const comp = this.competenceService.periodFilter().competenciaInicio;
    return comp ? this.competenceToDate(comp) : new Date(2024, 0, 1);
  });
  readonly rangeEndDate = linkedSignal<Date | null>(() => {
    const comp = this.competenceService.periodFilter().competenciaFim;
    return comp ? this.competenceToDate(comp) : new Date(2024, 2, 1);
  });

  readonly modeOptions = [
    { label: 'Mês Específico', value: 'SPECIFIC', icon: 'pi pi-calendar' },
    { label: 'Recorte Temporal', value: 'RANGE', icon: 'pi pi-sliders-h' },
    { label: 'Vigência Global', value: 'GLOBAL', icon: 'pi pi-globe' },
  ];

  applySpecific(popover: any): void {
    const date = this.selectedSpecificDate();
    if (date) {
      const comp = this.dateToCompetence(date);
      this.competenceService.setSpecificCompetence(comp);
      popover.hide();
    }
  }

  applyCustomRange(popover: any): void {
    const start = this.rangeStartDate();
    const end = this.rangeEndDate();
    if (start && end) {
      const startComp = this.dateToCompetence(start);
      const endComp = this.dateToCompetence(end);
      this.competenceService.setRange(startComp, endComp);
      popover.hide();
    }
  }

  applyGlobal(popover: any): void {
    const bounds = this.competenceService.globalBounds();
    this.competenceService.setGlobal(bounds.competenciaInicio, bounds.competenciaFim);
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

  private competenceToDate(code: string): Date {
    if (!code || code.length < 6) return new Date();
    const year = parseInt(code.substring(0, 4), 10);
    const month = parseInt(code.substring(4, 6), 10) - 1;
    return new Date(year, month, 1);
  }

  private dateToCompetence(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}${month}`;
  }
}

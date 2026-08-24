import { Injectable, computed, signal } from '@angular/core';
import { CompetenciaOption } from '../models/competence.model';

@Injectable({
  providedIn: 'root',
})
export class CompetenceService {
  private readonly _competencias = signal<CompetenciaOption[]>(this.generateCompetencias());
  private readonly _competencia = signal<string>(this.getDefaultCompetencia());

  readonly competencias = computed(() => this._competencias());
  readonly competencia = computed(() => this._competencia());

  readonly competenciaFormatada = computed(() => {
    const raw = this._competencia();
    if (!raw || raw.length !== 6) return raw;
    const ano = raw.substring(0, 4);
    const mes = raw.substring(4, 6);
    return `${mes}/${ano}`;
  });

  readonly selectedOption = computed(() => {
    return this.competencias().find((c) => c.value === this._competencia()) ?? null;
  });

  setCompetence(competencia: string): void {
    if (competencia && competencia.length === 6) {
      this._competencia.set(competencia);
    }
  }

  nextCompetence(): void {
    const current = this._competencia();
    let ano = parseInt(current.substring(0, 4), 10);
    let mes = parseInt(current.substring(4, 6), 10);

    mes++;
    if (mes > 12) {
      mes = 1;
      ano++;
    }

    const nextCode = `${ano}${mes.toString().padStart(2, '0')}`;
    this.setCompetence(nextCode);
  }

  previousCompetence(): void {
    const current = this._competencia();
    let ano = parseInt(current.substring(0, 4), 10);
    let mes = parseInt(current.substring(4, 6), 10);

    mes--;
    if (mes < 1) {
      mes = 12;
      ano--;
    }

    const prevCode = `${ano}${mes.toString().padStart(2, '0')}`;
    this.setCompetence(prevCode);
  }

  private getDefaultCompetencia(): string {
    return '202401';
  }

  private generateCompetencias(): CompetenciaOption[] {
    const options: CompetenciaOption[] = [];
    const nomesMeses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    // Gera lista de 2023 até 2026 em ordem decrescente
    for (let ano = 2026; ano >= 2023; ano--) {
      for (let mes = 12; mes >= 1; mes--) {
        const mesPad = mes.toString().padStart(2, '0');
        options.push({
          value: `${ano}${mesPad}`,
          label: `${mesPad}/${ano} - ${nomesMeses[mes - 1]}`,
          ano,
          mes,
        });
      }
    }

    return options;
  }
}

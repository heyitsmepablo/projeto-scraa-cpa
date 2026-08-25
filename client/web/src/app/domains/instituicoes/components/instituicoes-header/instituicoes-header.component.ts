import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-instituicoes-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TagModule],
  templateUrl: './instituicoes-header.component.html',
  styleUrl: './instituicoes-header.component.css',
})
export class InstituicoesHeaderComponent {
  readonly competencia = input<string>('');
}

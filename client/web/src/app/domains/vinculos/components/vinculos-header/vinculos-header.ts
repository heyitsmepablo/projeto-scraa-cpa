import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-vinculos-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TagModule],
  templateUrl: './vinculos-header.html',
  styleUrl: './vinculos-header.css',
})
export class VinculosHeaderComponent {
  readonly competencia = input<string>('');
}

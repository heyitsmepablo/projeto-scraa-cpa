import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule, SortIcon } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { VinculoView } from '../../models/vinculo-view.model';

@Component({
  selector: 'app-vinculos-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    CardModule,
    TagModule,
    TableModule,
    ButtonModule,
    RippleModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SortIcon,
  ],
  templateUrl: './vinculos-table.html',
  styleUrl: './vinculos-table.css',
})
export class VinculosTableComponent {
  readonly vinculos = input<VinculoView[]>([]);
  readonly loading = input<boolean>(false);
  readonly expandedRows = input<{ [key: string]: boolean }>({});

  readonly expandedRowsChange = output<{ [key: string]: boolean }>();

  onExpandedRowsChange(event: any): void {
    this.expandedRowsChange.emit(event);
  }
}

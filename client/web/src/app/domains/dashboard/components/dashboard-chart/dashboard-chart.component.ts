import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-dashboard-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, TagModule, ChartModule],
  templateUrl: './dashboard-chart.component.html',
  styleUrl: './dashboard-chart.component.css',
})
export class DashboardChartComponent {
  readonly chartData = input<any>({});
  readonly chartOptions = input<any>({});
  readonly mesesCount = input<number>(1);
}

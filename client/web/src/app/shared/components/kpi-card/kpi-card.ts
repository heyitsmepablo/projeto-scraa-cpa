import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.css',
})
export class KpiCardComponent {
  readonly title = input.required<string>();
  readonly value = input<string | number>('');
  readonly icon = input<string | undefined>(undefined);
  readonly variant = input<string>('default');
  readonly theme = input<string | undefined>(undefined);
  readonly footerLabel = input<string | undefined>(undefined);
  readonly footerValue = input<string | number | undefined>(undefined);
  readonly customValueClass = input<string | undefined>(undefined);
  readonly customIconClass = input<string | undefined>(undefined);

  readonly resolvedValueClass = computed(() => {
    if (this.customValueClass()) {
      return this.customValueClass();
    }
    const v = (this.theme() || this.variant()).toLowerCase();
    switch (v) {
      case 'emerald':
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'blue':
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      case 'indigo':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'amber':
      case 'warn':
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'rose':
      case 'danger':
        return 'text-rose-600 dark:text-rose-400';
      case 'slate':
      case 'secondary':
      case 'default':
      default:
        return 'text-surface-900 dark:text-surface-0';
    }
  });

  readonly resolvedIconClass = computed(() => {
    if (this.customIconClass()) {
      return this.customIconClass();
    }
    const v = (this.theme() || this.variant()).toLowerCase();
    switch (v) {
      case 'emerald':
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40';
      case 'blue':
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200/60 dark:ring-blue-800/40';
      case 'indigo':
        return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200/60 dark:ring-indigo-800/40';
      case 'amber':
      case 'warn':
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/40';
      case 'rose':
      case 'danger':
        return 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200/60 dark:ring-rose-800/40';
      case 'slate':
      case 'secondary':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700';
      case 'default':
      default:
        return 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 ring-1 ring-surface-200 dark:ring-surface-700';
    }
  });
}

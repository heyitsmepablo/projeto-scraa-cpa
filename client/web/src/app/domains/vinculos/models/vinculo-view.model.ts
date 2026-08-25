import { Vinculo } from '../../../core/models/vinculo.model';

export interface VinculoView extends Vinculo {
  statusVigencia?: string;
  severityVigencia?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
}

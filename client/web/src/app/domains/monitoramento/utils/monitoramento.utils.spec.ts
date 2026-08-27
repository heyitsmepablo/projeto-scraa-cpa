import { 
  formatCurrency, 
  formatSigtapCode, 
  getComplexidadeSeverity, 
  getStatusSeverity, 
  getStatusLabel, 
  getClampedPercent, 
  getProgressBarClass, 
  getPercTextClass, 
  getSaldoFinanceiroClass 
} from './monitoramento.utils';

describe('MonitoramentoUtils', () => {
  describe('formatCurrency', () => {
    it('should format valid numbers correctly', () => {
      expect(formatCurrency(1500.5)).toContain('R$');
      expect(formatCurrency(1500.5)).toContain('1.500,50');
    });
    it('should format null or undefined as R$ 0,00', () => {
      expect(formatCurrency(null)).toContain('R$ 0,00');
      expect(formatCurrency(undefined)).toContain('R$ 0,00');
    });
  });

  describe('formatSigtapCode', () => {
    it('should format a valid 10 digit code', () => {
      expect(formatSigtapCode('0101010010')).toBe('01.01.01.001-0');
    });
    it('should return the original string if not exactly 10 digits', () => {
      expect(formatSigtapCode('12345')).toBe('12345');
    });
    it('should return "-" if no code is provided', () => {
      expect(formatSigtapCode('')).toBe('-');
    });
  });

  describe('getComplexidadeSeverity', () => {
    it('should return proper severity for each complexity', () => {
      expect(getComplexidadeSeverity('BC')).toBe('info');
      expect(getComplexidadeSeverity('MC')).toBe('warn');
      expect(getComplexidadeSeverity('AC')).toBe('danger');
      expect(getComplexidadeSeverity('UNKNOWN')).toBe('secondary');
    });
  });

  describe('getStatusSeverity', () => {
    it('should return proper severity for each status', () => {
      expect(getStatusSeverity('DENTRO')).toBe('success');
      expect(getStatusSeverity('ACIMA')).toBe('warn');
      expect(getStatusSeverity('ABAIXO')).toBe('danger');
      expect(getStatusSeverity('SEM_PACTO')).toBe('secondary');
    });
  });

  describe('getStatusLabel', () => {
    it('should return proper label', () => {
      expect(getStatusLabel('DENTRO')).toBe('Dentro da Meta');
      expect(getStatusLabel('SEM_PACTO')).toBe('Sem Pacto');
    });
  });

  describe('getClampedPercent', () => {
    it('should clamp percentage between 0 and 100', () => {
      expect(getClampedPercent(50)).toBe(50);
      expect(getClampedPercent(-10)).toBe(0);
      expect(getClampedPercent(150)).toBe(100);
      expect(getClampedPercent(null)).toBe(0);
    });
  });

  describe('getProgressBarClass', () => {
    it('should return proper CSS class', () => {
      expect(getProgressBarClass('DENTRO')).toBe('p-progressbar-emerald');
      expect(getProgressBarClass('ABAIXO')).toBe('p-progressbar-rose');
    });
  });

  describe('getPercTextClass', () => {
    it('should return proper Tailwind text class', () => {
      expect(getPercTextClass('DENTRO')).toContain('emerald');
      expect(getPercTextClass('ACIMA')).toContain('amber');
    });
  });

  describe('getSaldoFinanceiroClass', () => {
    it('should handle SEM_PACTO status', () => {
      expect(getSaldoFinanceiroClass(100, 'SEM_PACTO')).toContain('surface');
    });
    it('should handle positive balance', () => {
      expect(getSaldoFinanceiroClass(100, 'DENTRO')).toContain('amber');
    });
    it('should handle negative balance', () => {
      expect(getSaldoFinanceiroClass(-100, 'DENTRO')).toContain('rose');
    });
    it('should handle zero balance', () => {
      expect(getSaldoFinanceiroClass(0, 'DENTRO')).toContain('emerald');
    });
  });
});

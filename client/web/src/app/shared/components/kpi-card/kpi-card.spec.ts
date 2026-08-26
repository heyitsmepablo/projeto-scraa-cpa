import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { KpiCardComponent } from './kpi-card';

@Component({
  standalone: true,
  imports: [KpiCardComponent],
  template: `
    <app-kpi-card
      title="Test KPI"
      value="1.234"
      icon="pi pi-chart-bar"
      variant="emerald"
      footerLabel="Meta:"
      footerValue="5.000 un."
    >
      <span value-extra class="extra-badge">Extra</span>
      <div footer class="custom-footer">Custom Footer Content</div>
    </app-kpi-card>
  `,
})
class TestHostComponent {}

describe('KpiCardComponent', () => {
  let component: KpiCardComponent;
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Taxa de Ocupação');
    fixture.componentRef.setInput('value', '87.5%');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and value correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Taxa de Ocupação');
    expect(compiled.textContent).toContain('87.5%');
  });

  it('should apply appropriate variant classes', () => {
    fixture.componentRef.setInput('variant', 'emerald');
    fixture.componentRef.setInput('icon', 'pi pi-wallet');
    fixture.detectChanges();

    expect(component.resolvedValueClass()).toContain('text-emerald-600');
    expect(component.resolvedIconClass()).toContain('bg-emerald-50');

    fixture.componentRef.setInput('variant', 'rose');
    fixture.detectChanges();

    expect(component.resolvedValueClass()).toContain('text-rose-600');
    expect(component.resolvedIconClass()).toContain('bg-rose-50');
  });

  it('should render footer label and footer value when provided', () => {
    fixture.componentRef.setInput('footerLabel', 'Total Itens:');
    fixture.componentRef.setInput('footerValue', '42 un.');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Total Itens:');
    expect(compiled.textContent).toContain('42 un.');
  });

  it('should support content projection for value-extra and footer slots', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.extra-badge')).not.toBeNull();
    expect(compiled.querySelector('.extra-badge')?.textContent).toBe('Extra');
    expect(compiled.querySelector('.custom-footer')).not.toBeNull();
    expect(compiled.querySelector('.custom-footer')?.textContent).toBe('Custom Footer Content');
  });
});

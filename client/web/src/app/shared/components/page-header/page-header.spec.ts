import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect } from 'vitest';
import { PageHeaderComponent } from './page-header';

@Component({
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Test Title" description="Test Description">
      <button id="action-btn">Action Button</button>
    </app-page-header>
  `,
})
class TestHostComponent {}

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Initial Title');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and description correctly', () => {
    fixture.componentRef.setInput('title', 'Minha Página');
    fixture.componentRef.setInput('description', 'Subtítulo descritivo');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Minha Página');
    expect(compiled.querySelector('p')?.textContent?.trim()).toBe('Subtítulo descritivo');
  });

  it('should not render description paragraph when not provided', () => {
    fixture.componentRef.setInput('title', 'Sem Descrição');
    fixture.componentRef.setInput('description', undefined);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Sem Descrição');
    expect(compiled.querySelector('p')).toBeNull();
  });

  it('should project content into actions container', () => {
    const hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement as HTMLElement;
    const btn = compiled.querySelector('#action-btn');
    expect(btn).not.toBeNull();
    expect(btn?.textContent?.trim()).toBe('Action Button');
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Test Title');
    expect(compiled.querySelector('p')?.textContent?.trim()).toBe('Test Description');
  });
});

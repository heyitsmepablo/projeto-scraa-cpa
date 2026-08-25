import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoramentoHeroComponent } from './monitoramento-hero.component';

describe('MonitoramentoHeroComponent', () => {
  let component: MonitoramentoHeroComponent;
  let fixture: ComponentFixture<MonitoramentoHeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitoramentoHeroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MonitoramentoHeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

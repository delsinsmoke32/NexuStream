import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeriePage } from './serie.page';

describe('SeriePage', () => {
  let component: SeriePage;
  let fixture: ComponentFixture<SeriePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SeriePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

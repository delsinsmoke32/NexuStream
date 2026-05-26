import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetaballsPage } from './metaballs.page';

describe('MetaballsPage', () => {
  let component: MetaballsPage;
  let fixture: ComponentFixture<MetaballsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaballsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

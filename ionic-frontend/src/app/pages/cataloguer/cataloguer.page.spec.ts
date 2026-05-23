import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CataloguerPage } from './cataloguer.page';

describe('CataloguerPage', () => {
  let component: CataloguerPage;
  let fixture: ComponentFixture<CataloguerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CataloguerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

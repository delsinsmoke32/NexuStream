import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CataloguerSeasonModalComponent } from './cataloguer-season-modal.component';

describe('CataloguerSeasonModalComponent', () => {
  let component: CataloguerSeasonModalComponent;
  let fixture: ComponentFixture<CataloguerSeasonModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CataloguerSeasonModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CataloguerSeasonModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CataloguerShowModalComponent } from './cataloguer-show-modal.component';

describe('CataloguerShowModalComponent', () => {
  let component: CataloguerShowModalComponent;
  let fixture: ComponentFixture<CataloguerShowModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CataloguerShowModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CataloguerShowModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

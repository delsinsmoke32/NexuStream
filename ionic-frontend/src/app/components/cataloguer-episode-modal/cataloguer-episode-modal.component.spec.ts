import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CataloguerEpisodeModalComponent } from './cataloguer-episode-modal.component';

describe('CataloguerEpisodeModalComponent', () => {
  let component: CataloguerEpisodeModalComponent;
  let fixture: ComponentFixture<CataloguerEpisodeModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CataloguerEpisodeModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CataloguerEpisodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

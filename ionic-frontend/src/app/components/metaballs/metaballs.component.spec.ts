import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MetaballsScreenSaverComponent } from './metaballs.component';

describe('MetaballsScreenSaverComponent', () => {
  let component: MetaballsScreenSaverComponent;
  let fixture: ComponentFixture<MetaballsScreenSaverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MetaballsScreenSaverComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MetaballsScreenSaverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

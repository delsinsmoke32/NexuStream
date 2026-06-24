import { TestBed } from '@angular/core/testing';

import { AvatarPicker } from './avatar-picker';

describe('AvatarPicker', () => {
  let service: AvatarPicker;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AvatarPicker);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

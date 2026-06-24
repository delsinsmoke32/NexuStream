import { TestBed } from '@angular/core/testing';

import { Episode } from './episode';

describe('Episode', () => {
  let service: Episode;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Episode);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

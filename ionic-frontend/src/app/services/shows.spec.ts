import { TestBed } from '@angular/core/testing';

import { Shows } from './shows';

describe('Shows', () => {
  let service: Shows;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Shows);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

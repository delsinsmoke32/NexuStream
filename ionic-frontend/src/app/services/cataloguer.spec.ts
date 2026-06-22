import { TestBed } from '@angular/core/testing';

import { Cataloguer } from './cataloguer';

describe('Cataloguer', () => {
  let service: Cataloguer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cataloguer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

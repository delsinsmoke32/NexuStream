import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { CataloguerGuard } from './cataloguer-guard';

describe('CataloguerGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => CataloguerGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

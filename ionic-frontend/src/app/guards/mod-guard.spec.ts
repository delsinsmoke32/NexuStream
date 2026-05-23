import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { ModGuard } from './mod-guard';

describe('ModGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => ModGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

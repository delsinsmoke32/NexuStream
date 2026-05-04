import { CanActivateFn } from '@angular/router';

export const sampleGuard: CanActivateFn = (route, state) => {
  return true;
};

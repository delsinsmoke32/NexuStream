import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const ModGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const rolesJson = localStorage.getItem('user_roles');

  // Se c'è il token e ci sono i ruoli
  if (token && rolesJson) {
    try {
      const roles: string[] = JSON.parse(rolesJson);
      
      // Permetti l'accesso solo all'admin e ai mod
      if (roles.includes('admin') || roles.includes('mod')) {
        return true;
      }
    } catch (e) {
      console.error("Errore nel parsing dei ruoli", e);
    }
  }

  // Se non ha i permessi, reindirizza al 403
  return router.parseUrl('/forbidden'); 
};
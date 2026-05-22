import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const AdminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const rolesJson = localStorage.getItem('user_roles'); // 👈 Leggiamo l'array al plurale

  // Se c'è il token e ci sono i ruoli
  if (token && rolesJson) {
    try {
      const roles: string[] = JSON.parse(rolesJson);
      
      // Permetti l'accesso a chiunque sia un utente base, mod, cataloguer o admin
      if (roles.includes('user') || roles.includes('mod') || roles.includes('cataloguer') || roles.includes('admin')) {
        return true; // 🔓 Accesso consentito!
      }
    } catch (e) {
      console.error("Errore nel parsing dei ruoli", e);
    }
  }

  // Se non ha i permessi, reindirizza al login o a una pagina di errore
  return router.parseUrl('/login'); 
};
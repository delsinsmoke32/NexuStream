import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const AdminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    try {
      // Decodifichiamo il payload del JWT al volo
      const decodedToken = jwtDecodeHelper(token); 
      
      // Mappiamo il controllo sul flag reale del tuo token (es. user.isAdmin === 1)
      if (decodedToken && decodedToken.isAdmin === 1) {
        return true; // Accesso consentito
      }
    } catch (e) {
      console.error("Token non valido, corrotto o manomesso", e);
    }
  }

  // Se non è admin o il token è manomesso, reindirizza al forbidden
  return router.parseUrl('/forbidden'); 
};

/**
 * Helper nativo per decodificare il payload di un JWT senza librerie esterne.
 * Prende la stringa centrale del token, la converte da Base64 e fa il JSON.parse.
 */
function jwtDecodeHelper(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null; // Un JWT deve avere sempre 3 parti

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const ModGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    try {
      // Decodifichiamo il payload del JWT al volo per leggere i dati reali ed immutabili
      const decodedToken = jwtDecodeHelper(token); 
      
      // Permettiamo l'accesso se l'utente è un Moderatore
      if (decodedToken && (decodedToken.isMod === 1)) {
        return true; // Accesso consentito
      }
    } catch (e) {
      console.error("Token non valido, corrotto o manomesso", e);
    }
  }

  // Se i flag non sono validi o il token è compromesso, reindirizza alla pagina 403
  return router.parseUrl('/forbidden'); 
};

/**
 * Helper nativo per decodificare il payload di un JWT senza librerie esterne.
 * Estrae la sezione centrale del token (payload) e la decodifica da Base64Url a JSON.
 */
function jwtDecodeHelper(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null; // Struttura JWT non valida

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
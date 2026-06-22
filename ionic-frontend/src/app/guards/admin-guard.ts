import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { jwtDecodeHelper } from '../utils/jwt-helper'; // Assicurati che il path sia corretto

export const AdminGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const toastCtrl = inject(ToastController);
  const token = localStorage.getItem('token');

  if (token) {
    const decodedToken = jwtDecodeHelper(token); 
    if (decodedToken && decodedToken.isAdmin === 1) {
      return true; // È un Admin, prego si accomodi
    }
  }

  // Non ha i permessi (o non ha il token)
  const toast = await toastCtrl.create({
    message: 'Accesso negato. Privilegi di Amministratore richiesti.',
    duration: 3000,
    color: 'danger',
    position: 'bottom'
  });
  await toast.present();

  return router.parseUrl('/forbidden'); 
};
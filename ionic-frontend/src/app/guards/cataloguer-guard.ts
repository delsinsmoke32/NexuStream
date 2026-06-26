import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { jwtDecodeHelper } from '../utils/jwt-helper';

export const CataloguerGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const toastCtrl = inject(ToastController);
  const token = localStorage.getItem('token');

  if (token) {
    const decodedToken = jwtDecodeHelper(token); 
    
    if (decodedToken && decodedToken.isCat === 1) {
      return true; 
    }
  }

  const toast = await toastCtrl.create({
    message: 'Accesso negato. Privilegi di Catalogatore richiesti.',
    duration: 3000,
    color: 'danger',
    position: 'bottom'
  });
  await toast.present();

  return router.parseUrl('/forbidden'); 
};
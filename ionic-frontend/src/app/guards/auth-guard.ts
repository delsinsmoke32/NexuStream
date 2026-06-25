import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';

export const AuthGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const toastCtrl = inject(ToastController);
  const token = localStorage.getItem('token');

  if (token) return true; 

  const toast = await toastCtrl.create({
    message: 'Devi effettuare l\'accesso per vedere questa pagina.',
    duration: 3000,
    color: 'warning',
    position: 'bottom'
  });
  await toast.present();

  return router.parseUrl('/login'); 
};
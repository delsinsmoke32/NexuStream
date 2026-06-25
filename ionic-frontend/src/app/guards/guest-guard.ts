import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';

export const GuestGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const toastCtrl = inject(ToastController);
  const token = localStorage.getItem('token');

  if (!token) return true; 

  const toast = await toastCtrl.create({
    message: 'Sei già connesso a NexuStream.',
    duration: 2500,
    color: 'medium',
    position: 'bottom'
  });
  await toast.present();

  return router.parseUrl('/tabs/home'); 
};
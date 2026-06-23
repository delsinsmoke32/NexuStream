// percorso: src/app/app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { GuestGuard } from '@app/guards/guest-guard';
import { AdminGuard } from './guards/admin-guard'; 
import { CataloguerGuard } from './guards/cataloguer-guard';
import { ModGuard } from './guards/mod-guard';

export const routes: Routes = [
  // 1. Reindirizzamento iniziale: mandiamo l'utente direttamente dentro il guscio delle tab!
  {
    path: '',
    redirectTo: 'tabs/home', 
    pathMatch: 'full'
  },
  
  // 2. Rotte di Autenticazione (Protette dalla GuestGuard: chi è loggato non le vede)
  {
    path: 'login',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'reset-password',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/reset-password/reset-password.page').then( m => m.ResetPasswordPage)
  },
  {
    path: 'forgot-password',
    canActivate: [GuestGuard],
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  
  // 3. IL CUORE DELL'APP: La struttura a Tab (Home, Cerca, Preferiti, Profilo)
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then((m) => m.routes),
  },
  
  // 4. Pagine a Schermo Intero (Fuori dalle tab: la barra in basso qui scomparirà)
  {
    path: 'shows/:id',
    loadComponent: () => import('./pages/shows/shows.page').then(m => m.ShowsPage)
  },
  {
    path: 'episode/:episodeId',
    loadComponent: () => import('./pages/episode/episode.page').then(m => m.EpisodePage)
  },
  
  // 5. Pannelli di Lavoro Privati (Tutti protetti dalle loro specifiche Guard)
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage)
  },
  {
    path: 'cataloguer',
    canActivate: [CataloguerGuard],
    loadComponent: () => import('./pages/cataloguer/cataloguer.page').then( m => m.CataloguerPage)
  },
  {
    path: 'mod',
    canActivate: [ModGuard],
    loadComponent: () => import('./pages/mod/mod.page').then( m => m.ModPage)
  },
  
  // 6. Gestione Errori
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden/forbidden.page').then(m => m.ForbiddenPage)
  },
  {
    path: 'not-found', 
    loadComponent: () => import('./pages/notfound/notfound.page').then(m => m.NotfoundPage)
  },

  // 7. Easter Eggs
  {
    path: 'metaballs',
    loadComponent: () => import('./pages/metaballs/metaballs.page').then( m => m.MetaballsPage)
  },
  
  // QUESTA DEVE RIMANERE SEMPRE ALLA FINE
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full'
  }
];
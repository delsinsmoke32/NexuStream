import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin-guard'; // Assicurati che il percorso sia corretto
import { CataloguerGuard } from './guards/cataloguer-guard';
import { ModGuard } from './guards/mod-guard';

export const routes: Routes = [
  // 1. Reindirizzamento iniziale: se l'utente apre l'app senza path, lo mandiamo alla login (o alla home se preferisci)
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  
  // 2. Rotte di Autenticazione
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.page').then( m => m.ResetPasswordPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  
  // 3. Struttura a Tab (se decidi di usarla per la navigazione principale)
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  
  // 4. Pagine Principali Full-Screen (se esterne alle Tabs)
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then(m => m.SearchPage)
  },
  
  // 5. Pagine di Dettaglio con ID dinamico (fondamentali per caricare i dati corretti dal DB)
  {
    path: 'shows/:id',
    loadComponent: () => import('./pages/shows/shows.page').then(m => m.ShowsPage)
  },
  {
    path: 'episode/:episodeId',
    loadComponent: () => import('./pages/episode/episode.page').then(m => m.EpisodePage)
  },
  {
    path: 'favourites',
    loadComponent: () => import('./pages/favourites/favourites.page').then(m => m.FavouritesPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  
  // 6. Pagine private (admin, mod, catalogatori)
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
  
  // 7. Gestione Errori e Permessi
  {
    path: 'forbidden',
    loadComponent: () => import('./pages/forbidden/forbidden.page').then(m => m.ForbiddenPage)
  },
  {
    path: 'not-found', // Standardizzato con il trattino
    loadComponent: () => import('./pages/notfound/notfound.page').then(m => m.NotfoundPage)
  },

  // 8. Metaballs!
  {
    path: 'metaballs',
    loadComponent: () => import('./pages/metaballs/metaballs.page').then( m => m.MetaballsPage)
  },
  
  // QUESTA DEVE ESSERE L'ULTIMA ROUTE, ALTRIMENTI REDIRECTA A 404 ANCHE QUANDO NON DOVREBBE
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full'
  },

];
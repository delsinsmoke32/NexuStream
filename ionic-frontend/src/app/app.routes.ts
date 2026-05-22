import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin-guard'; // Assicurati che il percorso sia corretto

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
    path: 'serie/:showId',
    loadComponent: () => import('./pages/serie/serie.page').then(m => m.SeriePage)
  },
  {
    path: 'episode/:episodeId',
    loadComponent: () => import('./pages/episode/episode.page').then(m => m.EpisodePage)
  },
  
  // 6. Pannello Admin Privato (Protetto dal Guard)
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
    canActivate: [AdminGuard] // 👈 Protezione attiva
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
  
  // 8. Il Jolly (Wildcard): Cattura qualsiasi URL errato e lo lancia sulla 404 coerente
  {
    path: '**',
    redirectTo: 'not-found',
    pathMatch: 'full'
  }
];
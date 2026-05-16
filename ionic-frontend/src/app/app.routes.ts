import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'episode',
    loadComponent: () => import('./pages/episode/episode.page').then( m => m.EpisodePage)
  },
  {
    path: 'episode',
    loadComponent: () => import('./pages/episode/episode.page').then( m => m.EpisodePage)
  },
  {
    path: 'home-page',
    loadComponent: () => import('./pages/home-page/home-page.page').then( m => m.HomePagePage)
  },


];

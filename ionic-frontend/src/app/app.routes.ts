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
    path: 'home',
    loadComponent: () => import('./pages/home-page/home-page.page').then( m => m.HomePagePage)
  },
  {
    path: 'serie',
    loadComponent: () => import('./pages/serie/shows.page').then( m => m.SeriePage)
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.page').then( m => m.SearchPage)
  },
  {
    path: 'user',
    loadComponent: () => import('./pages/user/user.page').then( m => m.UserPage)
  },
  {
    path: 'favourites',
    loadComponent: () => import('./pages/favourites/favourites.page').then( m => m.FavouritesPage)
  },



];

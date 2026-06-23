// percorso: src/app/pages/tabs/tabs.routes.ts
import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from '../../guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../home/home.page').then(m => m.HomePage)
      },
      {
        path: 'search',
        loadComponent: () => import('../search/search.page').then(m => m.SearchPage)
      },
      {
        path: 'favourites',
        canActivate: [AuthGuard], // Opzionale, vedi la nostra chiacchierata precedente
        loadComponent: () => import('../favourites/favourites.page').then(m => m.FavouritesPage)
      },
      {
        path: 'profile',
        // In futuro creerai una profile.page, ma per ora puoi rimandare a settings se vuoi
        loadComponent: () => import('../settings/settings.page').then(m => m.SettingsPage) 
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  }
];
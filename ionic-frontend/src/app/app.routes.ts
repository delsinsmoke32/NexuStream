import { Routes } from '@angular/router'

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./pages/login/login.page').then((m) => m.LoginPage),
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./pages/register/register.page').then(
                (m) => m.RegisterPage
            ),
    },
    {
        path: 'episode',
        loadComponent: () =>
            import('./pages/episode/episode.page').then((m) => m.EpisodePage),
    },
    {
        path: 'home',
        loadComponent: () =>
            import('./pages/home/home.page').then((m) => m.HomePage),
    },
    {
        path: 'serie',
        loadComponent: () =>
            import('./pages/serie/serie.page').then((m) => m.SeriePage),
    },
    {
        path: 'search',
        loadComponent: () =>
            import('./pages/search/search.page').then((m) => m.SearchPage),
    },
]

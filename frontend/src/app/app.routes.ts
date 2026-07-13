import { type Routes } from '@angular/router';
import { LandingPageComponent } from './pages/landing-page/landing-page/landing-page.component';
import { HealthPageComponent } from './pages/health/health-page/health-page.component';
import { Error404Component } from './pages/error-404/error-404.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: LandingPageComponent,
    },
    {
        path: 'about',
        loadChildren: async () => import('./pages/about/about.routes'),
    },
    {
        path: 'exercises',
        loadChildren: async () => import('./pages/exercises/exercises.routes'),
    },
    {
        path: 'organisations',
        loadChildren: async () =>
            import('./pages/organisations/organisations.routes'),
    },
    {
        path: 'health',
        component: HealthPageComponent,
    },
    {
        path: '**',
        component: Error404Component,
        pathMatch: 'full',
    },
];

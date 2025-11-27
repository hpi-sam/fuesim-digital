import { NgModule } from '@angular/core';
import type { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AboutModule } from './pages/about/about.module';
import { Error404Component } from './pages/error-404/error-404.component';
import { HealthPageComponent } from './pages/health/health-page/health-page.component';
import { LandingPageComponent } from './pages/landing-page/landing-page/landing-page.component';

const routes: Routes = [
    {
        path: '',
        component: LandingPageComponent,
    },
    {
        path: 'about',
        loadChildren: () => AboutModule,
    },
    {
        path: 'exercises',
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        loadChildren: () =>
            import('./pages/exercises/exercises.module').then(
                (m) => m.ExercisesModule
            ),
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

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}

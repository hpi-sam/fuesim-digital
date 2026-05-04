import type { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from '../guards/is-authenticated.guard';
import { OrganisationListComponent } from './list/organisation-list.component';
import { OrganisationComponent } from './organisation/organisation.component';
import { JoinOrganisationComponent } from './join/join-organisation.component';

export const routes: Routes = [
    {
        path: '',
        component: OrganisationListComponent,
        canActivate: [IsAuthenticatedGuard],
    },
    {
        path: 'join/:token',
        canActivate: [IsAuthenticatedGuard],
        component: JoinOrganisationComponent,
    },
    {
        path: ':id',
        canActivate: [IsAuthenticatedGuard],
        component: OrganisationComponent,
    },
];

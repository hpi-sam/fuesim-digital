import type { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from '../guards/is-authenticated.guard';
import { OrganisationListComponent } from './list/organisation-list.component';

export const routes: Routes = [
    {
        path: '',
        component: OrganisationListComponent,
        canActivate: [IsAuthenticatedGuard],
    },
    // {
    //     path: ':id',
    //     canActivate: [JoinExerciseGuard],
    //     canDeactivate: [LeaveExerciseGuard],
    //     children: [
    //         {
    //             path: '',
    //             component: ExerciseComponent,
    //         },
    //     ],
    // },
];

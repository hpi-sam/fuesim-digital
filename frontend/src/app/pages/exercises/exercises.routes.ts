import type { Routes } from '@angular/router';
import { ExerciseComponent } from './exercise/exercise/exercise.component';
import { JoinExerciseGuard } from './guards/join-exercise.guard';
import { LeaveExerciseGuard } from './guards/leave-exercise.guard';
import { ExerciseListComponent } from './list/exercise-list.component';
import { ExerciseTemplateListComponent } from './template-list/exercise-template-list.component';
import { IsAuthenticatedGuard } from './guards/is-authenticated.guard';

export const routes: Routes = [
    {
        path: '',
        component: ExerciseListComponent,
        canActivate: [IsAuthenticatedGuard],
    },
    {
        path: 'templates',
        component: ExerciseTemplateListComponent,
        canActivate: [IsAuthenticatedGuard],
    },
    {
        path: ':exerciseId',
        canActivate: [JoinExerciseGuard],
        canDeactivate: [LeaveExerciseGuard],
        children: [
            {
                path: '',
                component: ExerciseComponent,
            },
        ],
    },
];

import type { Routes } from '@angular/router';
import { ExerciseComponent } from './exercise/exercise/exercise.component';
import { JoinExerciseGuard } from './guards/join-exercise.guard';
import { LeaveExerciseGuard } from './guards/leave-exercise.guard';
import { ExerciseListComponent } from './list/exercise-list.component';
import { ExerciseTemplateListComponent } from './template-list/exercise-template-list.component';
import { IsAuthenticatedGuard } from './guards/is-authenticated.guard';
import { ParallelExerciseComponent } from './parallel-exercise/parallel-exercise/parallel-exercise.component';
import { ParallelExerciseListComponent } from './parallel-exercise/list/parallel-exercise-list.component';
import { JoinParallelExerciseGuard } from './guards/join-parallel-exercise.guard';
import { LeaveParallelExerciseGuard } from './guards/leave-parallel-exercise.guard';

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
        path: 'parallel',
        component: ParallelExerciseListComponent,
        canActivate: [IsAuthenticatedGuard],
    },
    {
        path: 'parallel/:id',
        component: ParallelExerciseComponent,
        canActivate: [IsAuthenticatedGuard],
    },
    {
        path: 'parallel/join/:key',
        component: ParallelExerciseComponent,
        canActivate: [JoinParallelExerciseGuard],
        canDeactivate: [LeaveParallelExerciseGuard],
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

import type { Routes } from '@angular/router';
import { ExerciseComponent } from './exercise/exercise/exercise.component';
import { JoinExerciseGuard } from './guards/join-exercise.guard';
import { LeaveExerciseGuard } from './guards/leave-exercise.guard';
import { ExerciseListComponent } from './list/exercise-list.component';
import { ExerciseTemplateListComponent } from './template-list/exercise-template-list.component';
import { IsAuthenticatedGuard } from '../guards/is-authenticated.guard';
import { ParallelExerciseComponent } from './parallel-exercise/parallel-exercise/parallel-exercise.component';
import { ParallelExerciseListComponent } from './parallel-exercise/list/parallel-exercise-list.component';
import { JoinParallelExerciseGuard } from './guards/join-parallel-exercise.guard';
import { LeaveParallelExerciseGuard } from './guards/leave-parallel-exercise.guard';
import { AreParallelExercisesEnabledGuard } from './guards/are-parallel-exercises-enabled.guard';

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
        canActivate: [AreParallelExercisesEnabledGuard, IsAuthenticatedGuard],
    },
    {
        path: 'parallel/:id',
        component: ParallelExerciseComponent,
        canActivate: [AreParallelExercisesEnabledGuard, IsAuthenticatedGuard],
    },
    {
        path: 'parallel/join/:key',
        // This component is never actually shown, as JoinParallelExerciseGuard will redirect
        component: ParallelExerciseComponent,
        canActivate: [
            AreParallelExercisesEnabledGuard,
            JoinParallelExerciseGuard,
        ],
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

import { NgModule } from '@angular/core';
import type { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ExerciseComponent } from './exercise/exercise/exercise.component.js';
import { JoinExerciseGuard } from './guards/join-exercise.guard.js';
import { LeaveExerciseGuard } from './guards/leave-exercise.guard.js';

const routes: Routes = [
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

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ExercisesRoutingModule {}

import type { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from '../guards/is-authenticated.guard';
import { ExerciseComponent } from './exercise/exercise/exercise.component';
import { JoinExerciseGuard } from './guards/join-exercise.guard';
import { LeaveExerciseGuard } from './guards/leave-exercise.guard';
import { ExerciseListComponent } from './list/exercise-list.component';
import { ExerciseTemplateListComponent } from './template-list/exercise-template-list.component';
import { ParallelExerciseComponent } from './parallel-exercise/parallel-exercise/parallel-exercise.component';
import { ParallelExerciseListComponent } from './parallel-exercise/list/parallel-exercise-list.component';
import { JoinParallelExerciseGuard } from './guards/join-parallel-exercise.guard';
import { LeaveParallelExerciseGuard } from './guards/leave-parallel-exercise.guard';
import { AreParallelExercisesEnabledGuard } from './guards/are-parallel-exercises-enabled.guard';
import { MapViewComponent } from './exercise/shared/map-view/map-view.component';
import { EmergencyOperationsCenterFullComponent } from './exercise/shared/emergency-operations-center/emergency-operations-center-full/emergency-operations-center-full.component';
import { OperationsTabletViewComponent } from './exercise/shared/operations-tablet-view/operations-tablet-view.component';
import { WaitingRoomComponent } from './exercise/shared/waiting-room/waiting-room.component';
import { JoinTimeTravelGuard } from './guards/join-time-travel.guard';
import { LeaveTimeTravelGuard } from './guards/leave-time-travel.guard';

const exerciseRoutes: Routes = [
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
        component: ExerciseComponent,
        children: [
            {
                path: '',
                component: WaitingRoomComponent,
            },
            {
                path: 'map',
                component: MapViewComponent,
                loadChildren: async () =>
                    import('./exercise/shared/exercise-map/utility/sidebar.routes'),
            },
            {
                path: 'eoc',
                component: EmergencyOperationsCenterFullComponent,
            },
            {
                path: 'operations',
                component: OperationsTabletViewComponent,
            },
            {
                path: 'replay',
                canActivate: [JoinTimeTravelGuard],
                canDeactivate: [LeaveTimeTravelGuard],
                component: MapViewComponent,
                loadChildren: async () =>
                    import('./exercise/shared/exercise-map/utility/sidebar.routes'),
            },
        ],
    },
];
export default exerciseRoutes;

import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { ParallelExerciseService } from '../../../core/parallel-exercise.service';

@Injectable({
    providedIn: 'root',
})
export class LeaveParallelExerciseGuard {
    private readonly parallelExerciseService = inject(ParallelExerciseService);

    canDeactivate(
        component: unknown,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState?: RouterStateSnapshot
    ) {
        this.parallelExerciseService.leaveParallelExercise();
        return true;
    }
}

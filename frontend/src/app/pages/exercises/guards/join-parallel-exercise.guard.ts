import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api.service';

/**
 * Guard for handling the join of parallel exercises
 * Attention: Not an actual guard, just used for side effects
 */
@Injectable({
    providedIn: 'root',
})
export class JoinParallelExerciseGuard {
    private readonly router = inject(Router);
    private readonly apiService = inject(ApiService);

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        const exercise = await this.apiService.joinParallelExercise(
            route.params['key']
        );
        await this.router.navigate(['/exercises', exercise.participantKey]);
    }
}

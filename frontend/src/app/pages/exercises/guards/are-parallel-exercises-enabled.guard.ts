import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { ApiService } from '../../../core/api.service';

@Injectable({
    providedIn: 'root',
})
export class AreParallelExercisesEnabledGuard {
    private readonly apiService = inject(ApiService);

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        return this.apiService.getParallelExercisesEnabled();
    }
}

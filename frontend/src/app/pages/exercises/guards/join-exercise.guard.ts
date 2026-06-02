import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { tryToJoinExercise } from '../shared/join-exercise-modal/try-to-join-exercise';
import { ApplicationService } from '../../../core/application.service';
import { ApiService } from '../../../core/api.service';
import type { AppState } from '../../../state/app.state';
import { selectExerciseStateMode } from '../../../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';
import {
    getReconnectToken,
    clearReconnectToken,
} from '../../../core/reconnect-token';

@Injectable({
    providedIn: 'root',
})
export class JoinExerciseGuard {
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);
    private readonly apiService = inject(ApiService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly applicationService = inject(ApplicationService);

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        if (
            selectStateSnapshot(selectExerciseStateMode, this.store) ===
            'exercise'
        ) {
            return true;
        }
        try {
            const exerciseExists = await this.apiService.exerciseExists(
                route.params['exerciseId']
            );

            // Attempt auto-reconnect if a stored token exists
            if (exerciseExists.exists) {
                const storedClientId = getReconnectToken(
                    route.params['exerciseId']
                );
                if (storedClientId) {
                    try {
                        const reconnected =
                            await this.applicationService.joinExercise(
                                route.params['exerciseId'],
                                '',
                                storedClientId
                            );
                        if (reconnected) return true;
                        // Token was stale/invalid — clear it and fall through to normal join
                        clearReconnectToken(route.params['exerciseId']);
                    } catch (error) {
                        clearReconnectToken(route.params['exerciseId']);
                        throw error; // re-throw so outer catch still navigates to '/'
                    }
                }
            }

            let successfullyJoined = false;
            if (exerciseExists.autojoin) {
                successfullyJoined = await this.applicationService.joinExercise(
                    route.params['exerciseId'],
                    ''
                );
            } else {
                successfullyJoined = await tryToJoinExercise(
                    this.ngbModalService,
                    route.params['exerciseId']
                );
            }

            if (!successfullyJoined) {
                this.router.navigate(['/']);
            }
            return successfullyJoined;
        } catch {
            this.router.navigate(['/']);
            return false;
        }
    }
}

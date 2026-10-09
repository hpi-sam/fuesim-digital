import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApplicationService } from '../../../core/application.service';
import type { AppState } from '../../../state/app.state';
import {
    selectExerciseKey,
    selectExerciseStateMode,
} from '../../../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';

@Injectable({
    providedIn: 'root',
})
export class JoinTimeTravelGuard {
    private readonly router = inject(Router);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly applicationService = inject(ApplicationService);

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        switch (selectStateSnapshot(selectExerciseStateMode, this.store)) {
            case 'exercise':
                if (
                    selectStateSnapshot(selectCurrentMainRole, this.store) !==
                    'trainer'
                )
                    return this.router.parseUrl(
                        `/exercises/${selectStateSnapshot(selectExerciseKey, this.store)}`
                    );

                this.applicationService.startTimeTravel();
                return true;
            case 'timeTravel':
                // We are already in time travel mode, so we don't have to do anything
                return true;
            case undefined:
                // There is no active exercise, so we redirect to the landing page
                return this.router.parseUrl('/');
        }
    }
}

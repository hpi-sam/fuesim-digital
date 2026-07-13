import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ApplicationService } from '../../../core/application.service';
import type { AppState } from '../../../state/app.state';
import { selectExerciseStateMode } from '../../../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';

@Injectable({
    providedIn: 'root',
})
export class LeaveTimeTravelGuard {
    private readonly router = inject(Router);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly applicationService = inject(ApplicationService);

    async canDeactivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        switch (selectStateSnapshot(selectExerciseStateMode, this.store)) {
            case 'exercise':
                // We are already in time travel mode, so we don't have to do anything
                return true;
            case 'timeTravel':
                this.applicationService.rejoinExercise();
                return true;
            case undefined:
                // There is no active exercise, so we redirect to the landing page
                return this.router.parseUrl('/');
        }
    }
}

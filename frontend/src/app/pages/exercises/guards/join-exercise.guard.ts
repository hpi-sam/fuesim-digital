import { Injectable } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ApiService } from 'src/app/core/api.service';
import { MessageService } from 'src/app/core/messages/message.service';
import type { AppState } from 'src/app/state/app.state';
import { selectExerciseStateMode } from 'src/app/state/application/selectors/application.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import { tryToJoinExercise } from '../shared/join-exercise-modal/try-to-join-exercise';
import { ApplicationService } from '../../../core/application.service';

@Injectable({
    providedIn: 'root',
})
export class JoinExerciseGuard {
    constructor(
        private readonly ngbModalService: NgbModal,
        private readonly router: Router,
        private readonly apiService: ApiService,
        private readonly store: Store<AppState>,
        private readonly messageService: MessageService,
        private readonly applicationService: ApplicationService
    ) {}

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

            let successfullyJoined = false;
            if (exerciseExists.isTemplate) {
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

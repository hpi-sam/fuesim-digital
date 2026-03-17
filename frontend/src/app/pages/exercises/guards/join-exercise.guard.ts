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
import { MessageService } from '../../../core/messages/message.service';
import type { AppState } from '../../../state/app.state';
import { selectExerciseStateMode } from '../../../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';

@Injectable({
    providedIn: 'root',
})
export class JoinExerciseGuard {
    private readonly ngbModalService = inject(NgbModal);
    private readonly router = inject(Router);
    private readonly apiService = inject(ApiService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly messageService = inject(MessageService);
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

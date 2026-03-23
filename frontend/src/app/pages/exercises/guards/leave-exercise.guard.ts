import { Injectable, inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { ApplicationService } from '../../../core/application.service';
import { MessageService } from '../../../core/messages/message.service';
import type { AppState } from '../../../state/app.state';
import { selectExerciseStateMode } from '../../../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';
import { ParallelExerciseService } from '../../../core/parallel-exercise.service';

@Injectable({
    providedIn: 'root',
})
export class LeaveExerciseGuard {
    private readonly applicationService = inject(ApplicationService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly messageService = inject(MessageService);
    private readonly parallelExerciseService = inject(ParallelExerciseService);

    async canDeactivate(
        component: unknown,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState?: RouterStateSnapshot
    ) {
        // If the client has already left the exercise, we don't need to inform the user here.
        // This should be handled by the error handler/action that lead to the leave (e.g. the exercise deletion).
        if (
            selectStateSnapshot(selectExerciseStateMode, this.store) !==
            undefined
        ) {
            await this.applicationService.leaveExercise();
            if (!this.parallelExerciseService.isJoined) {
                this.messageService.postMessage({
                    title: 'Übung verlassen',
                    body: 'Sie können der Übung über die Übungs-ID wieder beitreten.',
                    color: 'info',
                });
            }
        }
        return true;
    }
}

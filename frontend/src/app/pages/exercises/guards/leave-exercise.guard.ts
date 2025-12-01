import { Injectable } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { ApplicationService } from 'src/app/core/application.service';
import { MessageService } from 'src/app/core/messages/message.service';
import type { AppState } from 'src/app/state/app.state';
import { selectExerciseStateMode } from 'src/app/state/application/selectors/application.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

@Injectable({
    providedIn: 'root',
})
export class LeaveExerciseGuard {
    constructor(
        private readonly applicationService: ApplicationService,
        private readonly store: Store<AppState>,
        private readonly messageService: MessageService
    ) {}

    canDeactivate(
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
            this.applicationService.leaveExercise();
            this.messageService.postMessage({
                title: 'Übung verlassen',
                body: 'Sie können der Übung über die Übungs-ID wieder beitreten.',
                color: 'info',
            });
        }
        return true;
    }
}

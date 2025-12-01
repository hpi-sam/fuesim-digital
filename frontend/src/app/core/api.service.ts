import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    ExerciseIds,
    ExerciseTimeline,
    StateExport,
} from 'digital-fuesim-manv-shared';
import { freeze } from 'immer';
import { lastValueFrom } from 'rxjs';
import type { AppState } from '../state/app.state';
import { selectExerciseId } from '../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../state/get-state-snapshot';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    constructor(
        private readonly store: Store<AppState>,
        private readonly messageService: MessageService,
        private readonly httpClient: HttpClient
    ) {}

    public async createExercise() {
        return lastValueFrom(
            this.httpClient.post<ExerciseIds>(`${httpOrigin}/api/exercise`, {})
        );
    }

    public async importExercise(exportedState: StateExport) {
        return lastValueFrom(
            this.httpClient.post<ExerciseIds>(
                `${httpOrigin}/api/exercise`,
                exportedState
            )
        );
    }

    public async exerciseHistory() {
        const exerciseId = selectStateSnapshot(selectExerciseId, this.store);
        return lastValueFrom(
            this.httpClient.get<ExerciseTimeline>(
                `${httpOrigin}/api/exercise/${exerciseId}/history`
            )
        ).then((value) => freeze(value, true));
    }

    public async deleteExercise(trainerId: string) {
        return lastValueFrom(
            this.httpClient.delete<undefined>(
                `${httpOrigin}/api/exercise/${trainerId}`,
                {}
            )
        );
    }

    /**
     * @param exerciseId the trainerId or participantId of the exercise
     * @returns wether the exercise exists
     */
    public async exerciseExists(exerciseId: string) {
        return lastValueFrom(
            this.httpClient.get<null>(
                `${httpOrigin}/api/exercise/${exerciseId}`
            )
        )
            .then(() => true)
            .catch((error) => {
                if (error.status !== 404) {
                    this.messageService.postError({
                        title: 'Interner Fehler',
                        error,
                    });
                }
                return false;
            });
    }
}

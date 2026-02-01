import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    exerciseExistsSchema,
    exercisesSchema,
    ExerciseTemplateCreateData,
    exerciseTemplateSchema,
    exerciseTemplatesSchema,
    UUID,
    type ExerciseAccessIds,
    type ExerciseTimeline,
    type StateExport,
} from 'digital-fuesim-manv-shared';
import { freeze } from 'immer';
import { lastValueFrom, map } from 'rxjs';
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
            this.httpClient.post<ExerciseAccessIds>(
                `${httpOrigin}/api/exercise`,
                {}
            )
        );
    }

    public async importExercise(exportedState: StateExport) {
        return lastValueFrom(
            this.httpClient.post<ExerciseAccessIds>(
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
            this.httpClient.delete(`${httpOrigin}/api/exercise/${trainerId}`)
        );
    }

    /**
     * @param exerciseId the trainerId or participantId of the exercise
     * @returns wether the exercise exists
     */
    public async exerciseExists(exerciseId: string) {
        return lastValueFrom(
            this.httpClient
                .get(`${httpOrigin}/api/exercise/${exerciseId}`)
                .pipe(map((v) => exerciseExistsSchema.parse(v)))
        );
    }

    public getExercisesResource() {
        return httpResource(() => `${httpOrigin}/api/exercises/`, {
            parse: exercisesSchema.parse,
        });
    }
    public getExerciseTemplatesResource() {
        return httpResource(() => `${httpOrigin}/api/exercise_templates/`, {
            parse: exerciseTemplatesSchema.parse,
        });
    }

    public async createExerciseTemplate(data: ExerciseTemplateCreateData) {
        return lastValueFrom(
            this.httpClient
                .post(`${httpOrigin}/api/exercise_template`, data)
                .pipe(map((v) => exerciseTemplateSchema.parse(v)))
        );
    }

    public async patchExerciseTemplate(
        id: UUID,
        data: ExerciseTemplateCreateData
    ) {
        return lastValueFrom(
            this.httpClient
                .patch(`${httpOrigin}/api/exercise_template/${id}`, data)
                .pipe(map((v) => exerciseTemplateSchema.parse(v)))
        );
    }

    public async createExerciseFromTemplate(id: UUID) {
        return lastValueFrom(
            this.httpClient.post<ExerciseAccessIds>(
                `${httpOrigin}/api/exercise_template/${id}/new`,
                {}
            )
        );
    }

    public async deleteExerciseTemplate(id: string) {
        return lastValueFrom(
            this.httpClient.delete(`${httpOrigin}/api/exercise_template/${id}`)
        );
    }
}

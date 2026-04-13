import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    exerciseExistsResponseDataSchema,
    ExerciseKey,
    exerciseKeysSchema,
    getExercisesResponseDataSchema,
    getExerciseTemplateResponseDataSchema,
    getExerciseTemplatesResponseDataSchema,
    getOrganisationDetailsResponseDataSchema,
    getExerciseTemplateViewportsResponseDataSchema,
    getParallelExerciseResponseDataSchema,
    getParallelExercisesResponseDataSchema,
    PostExerciseTemplateRequestData,
    postJoinParallelExerciseResponseDataSchema,
    PostParallelExerciseRequestData,
    TrainerKey,
    type ExerciseTimeline,
    type StateExport,
    type PatchExerciseTemplateRequestData,
    ExerciseTemplateId,
    ParallelExerciseId,
    PatchParallelExerciseRequestData,
    GroupParticipantKey,
    getOrganisationsResponseDataSchema,
    PostOrganisationRequestDataSchema,
    getOrganisationResponseDataSchema,
    OrganisationId,
    PatchOrganisationRequestData,
    postOrganisationInviteLinkResponseDataSchema,
    OrganisationMembershipId,
    OrganisationMembershipRole,
} from 'fuesim-digital-shared';
import { freeze } from 'immer';
import { lastValueFrom, map } from 'rxjs';
import { z } from 'zod';
import type { AppState } from '../state/app.state';
import { selectExerciseKey } from '../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../state/get-state-snapshot';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly messageService = inject(MessageService);
    private readonly httpClient = inject(HttpClient);

    public async createExercise() {
        return lastValueFrom(
            this.httpClient
                .post(`${httpOrigin}/api/exercise`, {})
                .pipe(map((v) => exerciseKeysSchema.parse(v)))
        );
    }

    public async importExercise(exportedState: StateExport) {
        return lastValueFrom(
            this.httpClient
                .post(`${httpOrigin}/api/exercise`, exportedState)
                .pipe(map((v) => exerciseKeysSchema.parse(v)))
        );
    }

    public async exerciseHistory() {
        const exerciseKey = selectStateSnapshot(selectExerciseKey, this.store)!;
        return lastValueFrom(
            this.httpClient.get<ExerciseTimeline>(
                `${httpOrigin}/api/exercise/${exerciseKey}/history`
            )
        ).then((value) => freeze(value, true));
    }

    public async deleteExercise(trainerKey: TrainerKey) {
        return lastValueFrom(
            this.httpClient.delete(`${httpOrigin}/api/exercise/${trainerKey}`)
        );
    }

    /**
     * @param exerciseKey the trainerKey or participantKey of the exercise
     * @returns whether the exercise exists
     */
    public async exerciseExists(exerciseKey: ExerciseKey) {
        return lastValueFrom(
            this.httpClient
                .get(`${httpOrigin}/api/exercise/${exerciseKey}`)
                .pipe(map((v) => exerciseExistsResponseDataSchema.parse(v)))
        );
    }

    public getExercisesResource() {
        return httpResource(() => `${httpOrigin}/api/exercises/`, {
            parse: getExercisesResponseDataSchema.parse,
        });
    }
    public getExerciseTemplatesResource() {
        return httpResource(() => `${httpOrigin}/api/exercise_templates/`, {
            parse: getExerciseTemplatesResponseDataSchema.parse,
        });
    }

    public getParallelExercisesEnabledResource() {
        return httpResource(
            () => `${httpOrigin}/api/parallel_exercises/enabled`,
            {
                parse: z.boolean().parse,
            }
        );
    }

    public async getParallelExercisesEnabled() {
        return lastValueFrom(
            this.httpClient.get(`${httpOrigin}/api/parallel_exercises/enabled`)
        ).then(z.boolean().parse);
    }

    public getParallelExerciseResource(id: ParallelExerciseId) {
        return httpResource(
            () => `${httpOrigin}/api/parallel_exercises/${id}`,
            {
                parse: getParallelExerciseResponseDataSchema.parse,
            }
        );
    }
    public async getParallelExercise(id: ParallelExerciseId) {
        return lastValueFrom(
            this.httpClient.get(`${httpOrigin}/api/parallel_exercises/${id}`)
        ).then(getParallelExerciseResponseDataSchema.parse);
    }
    public getParallelExercisesResource() {
        return httpResource(() => `${httpOrigin}/api/parallel_exercises/`, {
            parse: getParallelExercisesResponseDataSchema.parse,
        });
    }
    public async getExerciseTemplateViewportsById(id: ExerciseTemplateId) {
        return lastValueFrom(
            this.httpClient.get(
                `${httpOrigin}/api/exercise_templates/${id}/viewports`
            )
        ).then(getExerciseTemplateViewportsResponseDataSchema.parse);
    }

    public getOrganisationsResource() {
        return httpResource(() => `${httpOrigin}/api/organisations/`, {
            parse: getOrganisationsResponseDataSchema.parse,
        });
    }
    public getOrganisationResource(id: OrganisationId) {
        return httpResource(() => `${httpOrigin}/api/organisations/${id}`, {
            parse: getOrganisationDetailsResponseDataSchema.parse,
        });
    }

    public async createExerciseTemplate(data: PostExerciseTemplateRequestData) {
        return lastValueFrom(
            this.httpClient.post(`${httpOrigin}/api/exercise_templates`, data)
        ).then(getExerciseTemplateResponseDataSchema.parse);
    }

    public async importExerciseTemplate(exportedState: StateExport) {
        return lastValueFrom(
            this.httpClient.post(
                `${httpOrigin}/api/exercise_templates/import`,
                exportedState
            )
        ).then(getExerciseTemplateResponseDataSchema.parse);
    }

    public async patchExerciseTemplate(
        id: ExerciseTemplateId,
        data: PatchExerciseTemplateRequestData
    ) {
        return lastValueFrom(
            this.httpClient
                .patch(`${httpOrigin}/api/exercise_templates/${id}`, data)
                .pipe(
                    map((v) => getExerciseTemplateResponseDataSchema.parse(v))
                )
        );
    }

    public async createExerciseFromTemplate(templateId: ExerciseTemplateId) {
        return lastValueFrom(
            this.httpClient
                .post(
                    `${httpOrigin}/api/exercise_templates/${templateId}/new`,
                    {}
                )
                .pipe(map((v) => exerciseKeysSchema.parse(v)))
        );
    }

    public async deleteExerciseTemplate(templateId: ExerciseTemplateId) {
        return lastValueFrom(
            this.httpClient.delete(
                `${httpOrigin}/api/exercise_templates/${templateId}`
            )
        );
    }

    public async createParallelExercise(data: PostParallelExerciseRequestData) {
        return lastValueFrom(
            this.httpClient.post(`${httpOrigin}/api/parallel_exercises/`, data)
        ).then(getParallelExerciseResponseDataSchema.parse);
    }

    public async patchParallelExercise(
        id: ParallelExerciseId,
        data: PatchParallelExerciseRequestData
    ) {
        return lastValueFrom(
            this.httpClient.patch(
                `${httpOrigin}/api/parallel_exercises/${id}`,
                data
            )
        ).then(getParallelExerciseResponseDataSchema.parse);
    }

    public async deleteParallelExercise(id: ParallelExerciseId) {
        return lastValueFrom(
            this.httpClient.delete(`${httpOrigin}/api/parallel_exercises/${id}`)
        );
    }

    public async parallelExerciseExists(key: GroupParticipantKey) {
        return lastValueFrom(
            this.httpClient
                .get(`${httpOrigin}/api/parallel_exercises/join/${key}`)
                .pipe(map((v) => exerciseExistsResponseDataSchema.parse(v)))
        );
    }

    public async joinParallelExercise(key: string) {
        return lastValueFrom(
            this.httpClient.post(
                `${httpOrigin}/api/parallel_exercises/join/${key}`,
                undefined
            )
        ).then(postJoinParallelExerciseResponseDataSchema.parse);
    }

    public async createOrganisation(data: PostOrganisationRequestDataSchema) {
        return lastValueFrom(
            this.httpClient.post(`${httpOrigin}/api/organisations/`, data)
        ).then(getOrganisationResponseDataSchema.parse);
    }

    public async patchOrganisation(
        id: OrganisationId,
        data: PatchOrganisationRequestData
    ) {
        return lastValueFrom(
            this.httpClient
                .patch(`${httpOrigin}/api/organisations/${id}`, data)
                .pipe(map((v) => getOrganisationResponseDataSchema.parse(v)))
        );
    }

    public async createOrganisationInviteLink(id: OrganisationId) {
        return lastValueFrom(
            this.httpClient.post(
                `${httpOrigin}/api/organisations/${id}/invite_links`,
                {}
            )
        ).then(postOrganisationInviteLinkResponseDataSchema.parse);
    }

    public async joinOrganisation(token: string) {
        return lastValueFrom(
            this.httpClient.post(
                `${httpOrigin}/api/organisations/join/${token}`,
                {}
            )
        ).then(getOrganisationResponseDataSchema.parse);
    }

    public async updateOrganisationMembershipRole(
        id: OrganisationMembershipId,
        role: OrganisationMembershipRole
    ) {
        return lastValueFrom(
            this.httpClient.patch(
                `${httpOrigin}/api/organisations/memberships/${id}`,
                { role }
            )
        );
    }
}

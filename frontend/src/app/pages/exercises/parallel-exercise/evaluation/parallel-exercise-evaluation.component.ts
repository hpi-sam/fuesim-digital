import { Component, computed, effect, inject, signal } from '@angular/core';
import {
    EvalCriterion,
    EvalCriterionId,
    EvalResult,
    getIsCompletedFromEvalResult,
    getNumFromEvalResult,
    GetParallelExerciseResponseData,
    getRootCriteriaMap,
    ParallelExerciseInstanceSummary,
    ParticipantKey,
    UUID,
} from 'fuesim-digital-shared';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpResourceRef } from '@angular/common/http';
import { ParallelExerciseService } from '../../../../core/parallel-exercise.service';
import { ApiService } from '../../../../core/api.service';
import { EvalResultStatusBadgeComponent } from '../../exercise/shared/didactic-overview/result-status-badge/eval-result-status-badge.component';

@Component({
    selector: 'app-parallel-exercise-evaluation',
    templateUrl: './parallel-exercise-evaluation.component.html',
    styleUrls: ['parallel-exercise-evaluation.component.scss'],
    imports: [RouterLink, EvalResultStatusBadgeComponent],
})
export class ParallelExerciseEvaluationComponent {
    public readonly parallelExerciseService = inject(ParallelExerciseService);
    private readonly apiService = inject(ApiService);
    private readonly route = inject(ActivatedRoute);

    public readonly templateId = computed(() => {
        const exercise = this.parallelExercise.value();
        return exercise ? exercise.template.id : null;
    });
    public readonly rootCriteriaMap = signal<{
        [criterionId: UUID]: EvalCriterion;
    }>({});
    public readonly exerciseInstances =
        this.parallelExerciseService.exerciseInstances;

    public readonly resultsMap = computed(() =>
        this.exerciseInstances().reduce<{
            [key: ParticipantKey]: { [criterionId: string]: EvalResult };
        }>((mapObject, instanceSummary) => {
            mapObject[instanceSummary.participantKey] =
                instanceSummary.evalResults;
            return mapObject;
        }, {})
    );
    public readonly rootCriteria = computed(() =>
        Object.values(this.rootCriteriaMap())
    );
    parallelExercise: HttpResourceRef<
        GetParallelExerciseResponseData | undefined
    >;
    constructor() {
        const apiService = this.apiService;
        this.parallelExercise = apiService.getParallelExerciseResource(
            this.route.snapshot.params['id']
        );

        effect(async () => {
            const parallelExercise = this.parallelExercise.value();
            if (parallelExercise) {
                await this.parallelExerciseService.joinParallelExercise(
                    parallelExercise.id
                );
            }
            if (this.templateId()) {
                const results = Object.values(this.resultsMap());
                if (results.length > 0) {
                    const reductionBase = Object.values(results.at(0)!).map(
                        (res) => res.criterion
                    );
                    console.log('base criteria for reduction: ');
                    reductionBase.forEach((crit) => {
                        console.log(crit.name);
                    });
                    const criteria = results.reduce<EvalCriterion[]>(
                        /* We want only global criteria, across all instances */
                        (criteriaObject: EvalCriterion[], resultMap) => {
                            console.log('crieriaObject: ');
                            criteriaObject.forEach((crit) => {
                                console.log(crit.name);
                            });
                            const newIds = new Set(
                                Object.values(resultMap).map((res) => res.id)
                            );
                            const newObject = criteriaObject.filter(
                                (crit) => !newIds.has(crit.id)
                            );
                            return newObject;
                        },
                        [
                            ...Object.values(results.at(0)!).map(
                                (res) => res.criterion
                            ),
                        ]
                    );
                    console.log('global criteria: ');
                    criteria.forEach((crit) => {
                        console.log(crit.name);
                    });
                    const criteriaMap = criteria.reduce<{
                        [criterionId: EvalCriterionId]: EvalCriterion;
                    }>((mapObject, criterion) => {
                        mapObject[criterion.id] = criterion;
                        return mapObject;
                    }, {});
                    this.rootCriteriaMap.set(getRootCriteriaMap(criteriaMap));
                } else {
                    this.rootCriteriaMap.set({});
                }
            }
        });
    }
    public getResOfCriterionFromInstance(
        criterion: EvalCriterion,
        exerciseInstance: ParallelExerciseInstanceSummary
    ) {
        const result = exerciseInstance.evalResults[criterion.id];
        return result ?? null;
    }
    public getRootCriteriaMap = getRootCriteriaMap;
    public getNumFromEvalResult = getNumFromEvalResult;
    public getIsCompletedFromEvalResult = getIsCompletedFromEvalResult;
    public getParticipantUrl(
        exerciseInstance: ParallelExerciseInstanceSummary
    ) {
        return `${location.origin}/exercises/${exerciseInstance.participantKey}`;
    }
}

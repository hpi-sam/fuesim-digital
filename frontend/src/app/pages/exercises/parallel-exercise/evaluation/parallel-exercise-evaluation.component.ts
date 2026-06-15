import { Component, computed, inject } from '@angular/core';
import { ParallelExerciseService } from '../../../../core/parallel-exercise.service';
import {
    EvalCriterion,
    getIsCompletedFromEvalResult,
    getNumFromEvalResult,
    getRootCriteriaMap,
    ParallelExerciseInstanceSummary,
    ParticipantKey,
} from 'fuesim-digital-shared';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../state/app.state';
import { selectEvalCriteria } from '../../../../state/application/selectors/exercise.selectors';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-parallel-exercise-evaluation',
    templateUrl: './parallel-exercise-evaluation.component.html',
    styleUrls: ['parallel-exercise-evaluation.component.scss'],
    imports: [RouterLink, NgStyle],
})
export class ParallelExercise {
    public readonly parallelExerciseService = inject(ParallelExerciseService);
    public readonly store = inject<Store<AppState>>(Store);

    public readonly exerciseInstances =
        this.parallelExerciseService.exerciseInstances;

    public readonly rootCriteria = computed(() =>
        Object.values(
            this.getRootCriteriaMap(
                this.store.selectSignal(selectEvalCriteria)()
            )
        )
    );
    public getLatestResFromCriterionOfInstace(
        criterion: EvalCriterion,
        exerciseInstance: ParallelExerciseInstanceSummary
    ) {
        const resultArray = exerciseInstance.evalResults[criterion.id];
        return resultArray ? resultArray.at(resultArray.length - 1) : null;
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

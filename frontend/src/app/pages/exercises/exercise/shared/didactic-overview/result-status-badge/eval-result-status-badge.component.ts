import { Component, computed, input } from '@angular/core';
import {
    EvalCriterionId,
    EvalResult,
    getIsCompletedFromEvalResult,
    getNumFromEvalResult,
} from 'fuesim-digital-shared';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-eval-result-status-badge',
    templateUrl: './eval-result-status-badge.component.html',
    styleUrls: ['./eval-result-status-badge.component.scss'],
    imports: [NgStyle],
})
export class EvalResultStatusBadgeComponent {
    public readonly result = input.required<EvalResult>();
    public readonly resultsMap = input.required<{
        [criterionId: EvalCriterionId]: EvalResult;
    }>();
    public readonly isCompleted = computed(() =>
        getIsCompletedFromEvalResult(this.result())
    );
    public readonly singleNum = computed(() =>
        getNumFromEvalResult(this.result())
    );
    public readonly leftNumResult = computed(() => {
        const result = this.result();
        if (result.criterion.criterionType === 'greaterThanEvalCriterion') {
            const resultMap = this.resultsMap();
            return resultMap[result.criterion.leftChild] ?? null;
        }
        return null;
    });
    public readonly rightNumResult = computed(() => {
        const result = this.result();
        if (result.criterion.criterionType === 'greaterThanEvalCriterion') {
            const resultMap = this.resultsMap();
            return resultMap[result.criterion.rightChild] ?? null;
        }
        return null;
    });
    public readonly color = computed(() => {
        const isCompleted = this.isCompleted();
        if (isCompleted !== null) {
            return isCompleted ? 'green' : 'red';
        }
        const leftRes = this.leftNumResult();
        const rightRes = this.rightNumResult();
        if (leftRes && rightRes) {
            return getNumFromEvalResult(leftRes) ===
                getNumFromEvalResult(rightRes)
                ? 'green'
                : 'red';
        }
        return 'black';
    });
    public readonly bgOpacity = computed(() =>
        this.color() === 'black' ? 50 : 100
    );
}

import { Component, computed, input } from '@angular/core';
import { BoolEvalResult, NumberEvalResult } from 'fuesim-digital-shared';
import { NgStyle } from '../../../../../../../../node_modules/@angular/common/types/_common_module-chunk';

@Component({
    selector: 'app-eval-result-status-badge',
    templateUrl: './eval-result-status-badge.component.html',
    styleUrls: ['./eval-result-status-badge.component.scss'],
    imports: [NgStyle],
})
export class EvalResultStatusBadgeComponent {
    public readonly boolEvalResult = input<BoolEvalResult>();
    public readonly leftNumResult = input<NumberEvalResult>();
    public readonly rightNumResult = input<NumberEvalResult>();
    public readonly singleNumResult = input<NumberEvalResult>();
    public readonly color = computed(() => {
        const boolRes = this.boolEvalResult();
        if (boolRes !== undefined) {
            return boolRes.isCompleted ? 'green' : 'red';
        }
        const leftRes = this.leftNumResult();
        const rightRes = this.rightNumResult();
        if (leftRes && rightRes) {
            return leftRes.num === 0
                ? 'red'
                : leftRes.num === rightRes.num
                  ? 'green'
                  : 'yellow';
        }
        return 'grey';
    });
}

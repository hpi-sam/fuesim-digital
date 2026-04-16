import { Component, inject } from '@angular/core';
import { MeasureService } from '../../../../../../../core/measures.service';

@Component({
    selector: 'app-measure-details',
    imports: [],
    templateUrl: './measure-details.component.html',
    styleUrl: './measure-details.component.scss',
})
export class MeasureDetailsComponent {
    public readonly measureService = inject(MeasureService);

    public get activeMeasure() {
        return this.measureService.activeMeasure();
    }

    public get activeProperty() {
        return this.measureService.activeProperty();
    }

    public abortProperty() {
        this.measureService.endEvent?.next(false);
    }

    public completeProperty() {
        this.measureService.endEvent?.next(true);
    }
}

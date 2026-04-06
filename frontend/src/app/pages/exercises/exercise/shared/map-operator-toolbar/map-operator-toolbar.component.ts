import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MeasureTemplate } from 'fuesim-digital-shared';
import type { AppState } from '../../../../../state/app.state';
import { selectMeasureTemplates } from '../../../../../state/application/selectors/exercise.selectors';
import { MeasureService } from '../../../../../core/measures.service';
import { ScrollButtonsComponent } from '../../../../../shared/components/scroll-buttons/scroll-buttons.component';

@Component({
    selector: 'app-map-operator-toolbar',
    templateUrl: './map-operator-toolbar.component.html',
    styleUrls: ['./map-operator-toolbar.component.scss'],
    imports: [ScrollButtonsComponent],
})
export class MapOperatorToolbarComponent {
    private readonly store = inject<Store<AppState>>(Store);

    private readonly measureService = inject(MeasureService);

    private readonly measureTemplatesMap = this.store.selectSignal(
        selectMeasureTemplates
    );
    public readonly measureTemplates = computed(() =>
        Object.values(this.measureTemplatesMap())
    );

    public onMeasureTemplateSelect(template: MeasureTemplate) {
        this.measureService.executeMeasure(template);
    }
}

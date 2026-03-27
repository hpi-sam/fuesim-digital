import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from '../../../../../state/app.state';
import { selectMeasureTemplates } from '../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-map-operator-toolbar',
    templateUrl: './map-operator-toolbar.component.html',
    styleUrls: ['./map-operator-toolbar.component.scss'],
})
export class MapOperatorToolbarComponent {
    private readonly store = inject<Store<AppState>>(Store);

    private readonly measureTemplatesMap = this.store.selectSignal(
        selectMeasureTemplates
    );
    public readonly measureTemplates = computed(() =>
        Object.values(this.measureTemplatesMap())
    );

    public onMeasureTemplateSelect(template: any) {
        console.log('Selected measure template:', template);
    }
}

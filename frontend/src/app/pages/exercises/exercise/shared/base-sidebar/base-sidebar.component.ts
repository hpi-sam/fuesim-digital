import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../state/app.state';
import { selectCurrentMainRole } from '../../../../../state/application/selectors/shared.selectors';
import { MapOperatorToolbarComponent } from '../map-operator-toolbar/map-operator-toolbar.component';
import { TrainerMapEditorComponent } from '../trainer-map-editor/trainer-map-editor.component';
import { selectExerciseStateMode } from '../../../../../state/application/selectors/application.selectors';

@Component({
    selector: 'app-base-sidebar',
    imports: [MapOperatorToolbarComponent, TrainerMapEditorComponent],
    templateUrl: './base-sidebar.component.html',
    styleUrl: './base-sidebar.component.scss',
    host: { class: 'h-100' },
})
export class BaseSidebarComponent {
    private readonly store = inject<Store<AppState>>(Store);

    protected readonly role = this.store.selectSignal(selectCurrentMainRole);
    public readonly exerciseStateMode = this.store.selectSignal(
        selectExerciseStateMode
    );
}

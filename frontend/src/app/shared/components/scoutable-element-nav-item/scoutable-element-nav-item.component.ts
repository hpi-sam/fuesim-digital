import {
    Component,
    computed,
    inject,
    input,
    OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
    newScoutable,
    newUserGeneratedContent,
    ScoutableElement,
} from 'fuesim-digital-shared';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { AppState } from '../../../state/app.state';
import { ExerciseService } from '../../../core/exercise.service';
import { createSelectScoutable } from '../../../state/application/selectors/exercise.selectors';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';

@Component({
    selector: 'app-scoutable-element-nav-item',
    templateUrl: './scoutable-element-nav-item.component.html',
    styleUrls: ['./scoutable-element-nav-item.component.scss'],
    imports: [RichTextEditorComponent],
})
export class ScoutableElementNavItemComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    readonly element = input.required<ScoutableElement>();
    readonly scoutable = computed(() => {
        const element = this.element();
        if (!element.scoutableId) return null;
        return this.store.selectSignal(
            createSelectScoutable(element.scoutableId)
        )();
    });
    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);

    ngOnInit() {
        if (this.element().scoutableId === null) {
            this.makeScoutable(this.element());
        }
    }

    makeScoutable(element: ScoutableElement) {
        this.exerciseService.proposeAction(
            {
                type: '[Scoutable] Make scoutable',
                element,
                scoutable: newScoutable(),
                content: newUserGeneratedContent(),
            },
            true
        );
    }
    setVisibility(value: boolean) {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Set isVisibleForParticipants',
            scoutableId: this.scoutable()!.id,
            value,
        });
    }
}

import {
    Component,
    effect,
    inject,
    input,
    OnInit,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
    newScoutable,
    newUserGeneratedContent,
    Scoutable,
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
    readonly scoutable = signal<Scoutable | null>(null);

    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);

    constructor() {
        effect(() => {
            if (this.element().scoutableId) {
                this.scoutable.set(
                    this.store.selectSignal(
                        createSelectScoutable(this.element().scoutableId!)
                    )()
                );
            }
        });
    }
    async ngOnInit(): Promise<void> {
        if (this.element().scoutableId === null) {
            await this.makeScoutable(this.element());
        }
        this.scoutable.set(
            this.store.selectSignal(
                createSelectScoutable(this.element().scoutableId!)
            )()
        );
    }

    async makeScoutable(element: ScoutableElement) {
        await this.exerciseService.proposeAction(
            {
                type: '[Scoutable] Make scoutable',
                element: element,
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

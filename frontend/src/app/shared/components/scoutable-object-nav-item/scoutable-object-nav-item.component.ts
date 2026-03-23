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

@Component({
    selector: 'app-scoutable-object-nav-item',
    templateUrl: './scoutable-object-nav-item.component.html',
    styleUrls: ['./scoutable-object-nav-item.component.scss'],
    standalone: false,
})
export class ScoutableObjectNavItemComponent implements OnInit {
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
        if (!this.scoutable()?.userGeneratedContentId) {
            await this.assignContent();
        }
    }
    public async assignContent() {
        const content = newUserGeneratedContent();
        this.exerciseService.proposeAction({
            type: '[UserGeneratedContent] Assign new content to element',
            elementId: this.scoutable()!.id,
            content,
        });
    }

    async makeScoutable(element: ScoutableElement) {
        await this.exerciseService.proposeAction(
            {
                type: '[Scoutable] Make scoutable',
                element,
                scoutable: newScoutable(),
            },
            true
        );
    }
    setVisibility(value: boolean) {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Set isPaticipantVisible',
            scoutableId: this.scoutable()!.id,
            value,
        });
    }
}

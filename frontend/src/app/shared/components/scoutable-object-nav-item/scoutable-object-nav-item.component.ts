import {
    Component,
    effect,
    inject,
    input,
    OnInit,
    signal,
    Signal,
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
    scoutable: Signal<Scoutable | null> = signal(null);

    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);

    constructor() {
        effect(() => {
            if (this.element().scoutableId) {
                this.scoutable = this.store.selectSignal(
                    createSelectScoutable(this.element().scoutableId!)
                );
            }
        });
    }

    ngOnInit(): void {
        if (!this.element().scoutableId) {
            this.makeScoutable(this.element());
        }
    }
    public assignContent() {
        this.exerciseService.proposeAction({
            type: '[UserGeneratedContent] Assign new content to element',
            elementId: this.scoutable()!.id,
            content: newUserGeneratedContent(),
        });
    }

    makeScoutable(element: ScoutableElement) {
        this.exerciseService.proposeAction({
            type: '[Scoutable] Make scoutable',
            element: element,
            scoutable: newScoutable(),
        });
    }
}

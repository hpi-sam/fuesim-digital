import {
    Component,
    effect,
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
} from 'digital-fuesim-manv-shared';
import { AppState } from 'src/app/state/app.state';
import { selectCurrentMainRole } from 'src/app/state/application/selectors/shared.selectors';
import { ExerciseService } from 'src/app/core/exercise.service';
import { createSelectScoutable } from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-scoutable-object-nav-item',
    templateUrl: './scoutable-object-nav-item.component.html',
    styleUrls: ['./scoutable-object-nav-item.component.scss'],
    standalone: false,
})
export class ScoutableObjectNavItemComponent implements OnInit {
    element = input.required<ScoutableElement>();
    scoutable: Signal<Scoutable | null> = signal(null);

    readonly currentRole$ = this.store.select(selectCurrentMainRole);

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {
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
            elementId: element.id,
            elementType: element.type,
            scoutable: newScoutable(),
        });
    }
}

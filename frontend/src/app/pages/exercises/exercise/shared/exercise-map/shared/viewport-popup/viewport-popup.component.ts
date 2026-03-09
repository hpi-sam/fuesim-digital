import type { OnInit } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, Viewport } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { PopupService } from '../../utility/popup.service';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectViewport } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-viewport-popup',
    templateUrl: './viewport-popup.component.html',
    styleUrls: ['./viewport-popup.component.scss'],
    standalone: false,
})
export class ViewportPopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly popupService = inject(PopupService);

    // These properties are only set after OnInit
    public viewportId!: UUID;

    public viewport$?: Observable<Viewport>;
    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    ngOnInit() {
        this.viewport$ = this.store.select(
            createSelectViewport(this.viewportId)
        );
    }

    public renameViewport(newName: string) {
        this.exerciseService.proposeAction({
            type: '[Viewport] Rename viewport',
            viewportId: this.viewportId,
            newName,
        });
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}

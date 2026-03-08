import type { OnInit } from '@angular/core';
import { ViewEncapsulation, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, TransferPoint } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { PopupService } from '../../utility/popup.service';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../state/app.state';
import { createSelectTransferPoint } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../../../../../state/application/selectors/shared.selectors';

type NavIds = 'hospitals' | 'names' | 'transferPoints';
/**
 * We want to remember the last selected nav item, so the user doesn't have to manually select it again.
 */
let activeNavId: NavIds = 'names';

@Component({
    selector: 'app-transfer-point-popup',
    templateUrl: './transfer-point-popup.component.html',
    styleUrls: ['./transfer-point-popup.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: false,
})
export class TransferPointPopupComponent implements OnInit {
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);

    // These properties are only set after OnInit
    public transferPointId!: UUID;

    public transferPoint$?: Observable<TransferPoint>;

    public readonly currentRole$ = this.store.select(selectCurrentMainRole);

    public get activeNavId() {
        return activeNavId;
    }
    public set activeNavId(value: NavIds) {
        activeNavId = value;
    }

    ngOnInit() {
        this.transferPoint$ = this.store.select(
            createSelectTransferPoint(this.transferPointId)
        );
    }

    public renameTransferPoint({
        internalName,
        externalName,
    }: {
        internalName?: string;
        externalName?: string;
    }) {
        this.exerciseService.proposeAction({
            type: '[TransferPoint] Rename TransferPoint',
            transferPointId: this.transferPointId,
            internalName,
            externalName,
        });
    }

    public closePopup() {
        this.popupService.closePopup();
    }
}

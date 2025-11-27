import type { OnInit } from '@angular/core';
import { ViewEncapsulation, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { UUID, TransferPoint } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import { createSelectTransferPoint } from 'src/app/state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from 'src/app/state/application/selectors/shared.selectors';
import { PopupService } from '../../utility/popup.service';

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

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {}

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

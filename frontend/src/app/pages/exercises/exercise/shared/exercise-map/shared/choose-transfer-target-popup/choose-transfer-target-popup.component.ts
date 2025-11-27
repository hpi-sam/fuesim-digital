import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Hospital, TransferPoint, UUID } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectReachableHospitals,
    createSelectReachableTransferPoints,
} from 'src/app/state/application/selectors/exercise.selectors';
import { PopupService } from '../../utility/popup.service';

@Component({
    selector: 'app-choose-transfer-target-popup',
    templateUrl: './choose-transfer-target-popup.component.html',
    styleUrls: ['./choose-transfer-target-popup.component.scss'],
    standalone: false,
})
export class ChooseTransferTargetPopupComponent implements OnInit {
    // These properties are only set after OnInit
    public transferPointId!: UUID;
    public droppedElementType!: 'personnel' | 'vehicle';

    public transferToCallback!: (
        targetId: UUID,
        targetType: 'hospital' | 'transferPoint'
    ) => void;

    public reachableTransferPoints$?: Observable<TransferPoint[]>;

    public reachableHospitals$?: Observable<Hospital[]>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly popupService: PopupService
    ) {}

    ngOnInit(): void {
        this.reachableTransferPoints$ = this.store.select(
            createSelectReachableTransferPoints(this.transferPointId)
        );
        this.reachableHospitals$ = this.store.select(
            createSelectReachableHospitals(this.transferPointId)
        );
    }

    public transferTo(targetId: UUID, type: 'hospital' | 'transferPoint') {
        this.transferToCallback(targetId, type);
        this.popupService.closePopup();
    }
}

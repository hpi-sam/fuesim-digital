import type { OnInit } from '@angular/core';
import { Component, Input, ViewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID } from 'digital-fuesim-manv-shared';
import { TransferPoint } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { SearchableDropdownOption } from 'src/app/shared/components/searchable-dropdown/searchable-dropdown.component';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectTransferPoint,
    selectTransferPoints,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-other-transfer-point-tab',
    templateUrl: './other-transfer-point-tab.component.html',
    styleUrls: ['./other-transfer-point-tab.component.scss'],
    standalone: false,
})
export class OtherTransferPointTabComponent implements OnInit {
    @Input() public transferPointId!: UUID;

    @ViewChild(NgbPopover) popover!: NgbPopover;

    public transferPoint$!: Observable<TransferPoint>;

    public reachableTransferPoints$!: Observable<
        { id: UUID; name: string; duration: number }[]
    >;

    /**
     * All transferPoints that are neither connected to this one nor this one itself
     */
    public transferPointsToBeAdded$!: Observable<SearchableDropdownOption[]>;

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

    ngOnInit() {
        this.transferPoint$ = this.store.select(
            createSelectTransferPoint(this.transferPointId)
        );

        const transferPoints$ = this.store.select(selectTransferPoints);

        this.transferPointsToBeAdded$ = transferPoints$.pipe(
            map((transferPoints) => {
                const currentTransferPoint =
                    transferPoints[this.transferPointId]!;
                return Object.entries(transferPoints)
                    .filter(
                        ([key]) =>
                            key !== this.transferPointId &&
                            !currentTransferPoint.reachableTransferPoints[key]
                    )
                    .map(([id, transferPoint]) => ({
                        key: id,
                        name: TransferPoint.getFullName(transferPoint),
                    }));
            })
        );

        this.reachableTransferPoints$ = combineLatest([
            this.transferPoint$,
            transferPoints$,
        ]).pipe(
            map(([transferPoint, transferPoints]) =>
                Object.entries(transferPoint.reachableTransferPoints)
                    .map(([key, value]) => ({
                        id: key,
                        name: TransferPoint.getFullName(transferPoints[key]!),
                        duration: value.duration,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name))
            )
        );
    }

    public connectTransferPoint(transferPointId: UUID, duration?: number) {
        this.exerciseService.proposeAction({
            type: '[TransferPoint] Connect TransferPoints',
            transferPointId1: this.transferPointId,
            transferPointId2: transferPointId,
            duration,
        });
    }

    public disconnectTransferPoint(transferPointId: UUID) {
        this.exerciseService.proposeAction({
            type: '[TransferPoint] Disconnect TransferPoints',
            transferPointId1: this.transferPointId,
            transferPointId2: transferPointId,
        });
    }

    public getTransferPointOrderByValue: (
        transferPoint: TransferPoint
    ) => string = (transferPoint) => TransferPoint.getFullName(transferPoint);
}

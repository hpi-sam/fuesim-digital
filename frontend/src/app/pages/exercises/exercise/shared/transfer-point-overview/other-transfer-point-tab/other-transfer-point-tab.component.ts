import type { OnInit } from '@angular/core';
import { Component, inject, input, viewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { UUID } from 'fuesim-digital-shared';
import { getTransferPointFullName, TransferPoint } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../core/exercise.service';
import type { SearchableDropdownOption } from '../../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import type { AppState } from '../../../../../../state/app.state';
import {
    createSelectTransferPoint,
    selectTransferPoints,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { TransferPointNameComponent } from '../../../../../../shared/components/transfer-point-name/transfer-point-name.component';
import { AppSaveOnTypingDirective } from '../../../../../../shared/directives/app-save-on-typing.directive';
import { SearchableDropdownComponent } from '../../../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import { ValuesPipe } from '../../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-other-transfer-point-tab',
    templateUrl: './other-transfer-point-tab.component.html',
    styleUrls: ['./other-transfer-point-tab.component.scss'],
    imports: [
        TransferPointNameComponent,
        FormsModule,
        AppSaveOnTypingDirective,
        NgbPopover,
        SearchableDropdownComponent,
        AsyncPipe,
        ValuesPipe,
    ],
})
export class OtherTransferPointTabComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    public readonly transferPointId = input.required<UUID>();

    readonly popover = viewChild.required(NgbPopover);

    public transferPoint$!: Observable<TransferPoint>;

    public reachableTransferPoints$!: Observable<
        { id: UUID; name: string; duration: number }[]
    >;

    /**
     * All transferPoints that are neither connected to this one nor this one itself
     */
    public transferPointsToBeAdded$!: Observable<SearchableDropdownOption[]>;

    ngOnInit() {
        this.transferPoint$ = this.store.select(
            createSelectTransferPoint(this.transferPointId())
        );

        const transferPoints$ = this.store.select(selectTransferPoints);

        this.transferPointsToBeAdded$ = transferPoints$.pipe(
            map((transferPoints) => {
                const currentTransferPoint =
                    transferPoints[this.transferPointId()]!;
                return Object.entries(transferPoints)
                    .filter(
                        ([key]) =>
                            key !== this.transferPointId() &&
                            !currentTransferPoint.reachableTransferPoints[key]
                    )
                    .map(([id, transferPoint]) => ({
                        key: id,
                        name: getTransferPointFullName(transferPoint),
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
                        name: getTransferPointFullName(transferPoints[key]!),
                        duration: value.duration,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name))
            )
        );
    }

    public connectTransferPoint(transferPointId: UUID, duration?: number) {
        this.exerciseService.proposeAction({
            type: '[TransferPoint] Connect TransferPoints',
            transferPointId1: this.transferPointId(),
            transferPointId2: transferPointId,
            duration,
        });
    }

    public disconnectTransferPoint(transferPointId: UUID) {
        this.exerciseService.proposeAction({
            type: '[TransferPoint] Disconnect TransferPoints',
            transferPointId1: this.transferPointId(),
            transferPointId2: transferPointId,
        });
    }

    public getTransferPointOrderByValue: (
        transferPoint: TransferPoint
    ) => string = (transferPoint) => getTransferPointFullName(transferPoint);
}

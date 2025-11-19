import type { OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AlarmGroup, UUID } from 'digital-fuesim-manv-shared';
import {
    createVehicleParameters,
    MapCoordinates,
    StrictObject,
    TransferPoint,
    uuid,
} from 'digital-fuesim-manv-shared';
import { Subject, takeUntil } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import { MessageService } from 'src/app/core/messages/message.service';
import type { AppState } from 'src/app/state/app.state';
import {
    selectAlarmGroups,
    selectMaterialTemplates,
    selectPersonnelTemplates,
    selectTransferPoints,
    selectVehicleTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectOwnClient } from 'src/app/state/application/selectors/shared.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

// We want to remember this
let targetTransferPointId: UUID | undefined;
let firstVehiclesTargetTransferPointId: UUID | undefined;
let firstVehiclesCount = 0;

@Component({
    selector: 'app-eoc-alarm-group-triggers',
    templateUrl: './eoc-alarm-group-triggers.component.html',
    styleUrls: ['./eoc-alarm-group-triggers.component.scss'],
    standalone: false,
})
export class EocAlarmGroupTriggersComponent implements OnDestroy {
    private readonly destroy$ = new Subject<void>();

    public readonly alarmGroups$ = this.store.select(selectAlarmGroups);

    public readonly transferPoints$ = this.store.select(selectTransferPoints);

    public getTransferPointOrderByValue: (
        transferPoint: TransferPoint
    ) => string = (transferPoint) => TransferPoint.getFullName(transferPoint);

    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>,
        private readonly messageService: MessageService
    ) {
        // reset chosen targetTransferPoint if it gets deleted
        this.transferPoints$
            .pipe(takeUntil(this.destroy$))
            .subscribe((transferPoints) => {
                if (
                    targetTransferPointId &&
                    !transferPoints[targetTransferPointId]
                ) {
                    this.targetTransferPointId = undefined;
                }
            });
    }

    public get targetTransferPointId() {
        return targetTransferPointId;
    }
    public set targetTransferPointId(value: UUID | undefined) {
        targetTransferPointId = value;
    }

    public get firstVehiclesTargetTransferPointId() {
        return firstVehiclesTargetTransferPointId;
    }
    public set firstVehiclesTargetTransferPointId(value: UUID | undefined) {
        firstVehiclesTargetTransferPointId = value;
    }

    public get firstVehiclesCount() {
        return firstVehiclesCount;
    }
    public set firstVehiclesCount(value: number) {
        firstVehiclesCount = value;
    }

    public async sendAlarmGroup(alarmGroup: AlarmGroup) {
        if (!this.targetTransferPointId) return;

        const firstVehiclesCountForAction = this.firstVehiclesCount;
        const firstVehiclesCountReducedBy = Math.min(
            Object.keys(alarmGroup.alarmGroupVehicles).length,
            this.firstVehiclesCount
        );
        this.firstVehiclesCount -= firstVehiclesCountReducedBy;

        const vehicleTemplates = selectStateSnapshot(
            selectVehicleTemplates,
            this.store
        );
        const vehicleTemplatesById = Object.fromEntries(
            vehicleTemplates.map((template) => [template.id, template])
        );

        const materialTemplates = selectStateSnapshot(
            selectMaterialTemplates,
            this.store
        );
        const personnelTemplates = selectStateSnapshot(
            selectPersonnelTemplates,
            this.store
        );

        const sortedAlarmGroupVehicles = StrictObject.values(
            alarmGroup.alarmGroupVehicles
        ).sort((a, b) => a.time - b.time);

        // We have to provide a map position when creating a vehicle
        // It will be overwritten directly after by putting the vehicle into transfer
        const placeholderPosition = MapCoordinates.create(0, 0);

        // Create vehicle parameters for the alarm group
        // This has to be done in the frontend to ensure the UUIDs of the vehicles, material, and personnel are consistent across all clients
        const vehicleParameters = sortedAlarmGroupVehicles.map(
            (alarmGroupVehicle) =>
                createVehicleParameters(
                    uuid(),
                    {
                        ...vehicleTemplatesById[
                            alarmGroupVehicle.vehicleTemplateId
                        ]!,
                        name: alarmGroupVehicle.name,
                    },
                    materialTemplates,
                    personnelTemplates,
                    placeholderPosition
                )
        );

        const request = await this.exerciseService.proposeAction({
            type: '[Emergency Operation Center] Send Alarm Group',
            clientName: selectStateSnapshot(selectOwnClient, this.store)!.name,
            alarmGroupId: alarmGroup.id,
            sortedVehicleParameters: vehicleParameters,
            targetTransferPointId: this.targetTransferPointId,
            firstVehiclesCount: firstVehiclesCountForAction,
            firstVehiclesTargetTransferPointId:
                this.firstVehiclesTargetTransferPointId,
        });

        if (request.success) {
            this.messageService.postMessage({
                title: `Alarmgruppe ${alarmGroup.name} alarmiert!`,
                color: 'success',
            });
        } else {
            this.firstVehiclesCount += firstVehiclesCountReducedBy;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
    }
}

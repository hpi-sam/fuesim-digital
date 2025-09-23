import {
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    AlarmGroupStartPoint,
    EocLogEntry,
    VehicleParameters,
} from '../../models/index.js';
import type { Mutable, UUID } from '../../utils/index.js';
import {
    StrictObject,
    cloneDeepMutable,
    uuidValidationOptions,
} from '../../utils/index.js';
import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import type { ExerciseState } from '../../state.js';
import { getElement } from './utils/index.js';
import { VehicleActionReducers } from './vehicle.js';
import { TransferActionReducers } from './transfer.js';
import { logAlarmGroupSent } from './utils/log.js';

export class AddLogEntryAction implements Action {
    @IsValue('[Emergency Operation Center] Add Log Entry' as const)
    public readonly type = '[Emergency Operation Center] Add Log Entry';
    @IsString()
    @MaxLength(255)
    public readonly name!: string;
    @IsString()
    @MaxLength(65535)
    public readonly message!: string;
}

export class SendAlarmGroupAction implements Action {
    @IsValue('[Emergency Operation Center] Send Alarm Group' as const)
    public readonly type = '[Emergency Operation Center] Send Alarm Group';

    @IsString()
    @MaxLength(255)
    public readonly clientName!: string;

    @IsUUID(4, uuidValidationOptions)
    public readonly alarmGroupId!: UUID;

    @IsArray()
    @ValidateNested()
    @Type(() => VehicleParameters)
    public readonly sortedVehicleParameters!: readonly VehicleParameters[];

    @IsUUID(4, uuidValidationOptions)
    public readonly targetTransferPointId!: UUID;

    @IsInt()
    @Min(0)
    public readonly firstVehiclesCount!: number;

    @IsOptional()
    @IsUUID(4, uuidValidationOptions)
    public readonly firstVehiclesTargetTransferPointId: UUID | undefined;
}

export namespace EmergencyOperationCenterActionReducers {
    export const addLogEntry: ActionReducer<AddLogEntryAction> = {
        action: AddLogEntryAction,
        reducer: (draftState, { name, message }) => {
            const logEntry = EocLogEntry.create(
                draftState.currentTime,
                message,
                name
            );
            draftState.eocLog.push(cloneDeepMutable(logEntry));
            return draftState;
        },
        rights: 'trainer',
    };
    export const sendAlarmGroup: ActionReducer<SendAlarmGroupAction> = {
        action: SendAlarmGroupAction,
        reducer: (
            draftState,
            {
                clientName,
                alarmGroupId,
                sortedVehicleParameters,
                targetTransferPointId,
                firstVehiclesCount,
                firstVehiclesTargetTransferPointId,
            }
        ) => {
            const alarmGroup = getElement(
                draftState,
                'alarmGroup',
                alarmGroupId
            );

            const sortedAlarmGroupVehicles = StrictObject.values(
                alarmGroup.alarmGroupVehicles
            ).sort((a, b) => a.time - b.time);

            const targetTransferPoint = getElement(
                draftState,
                'transferPoint',
                targetTransferPointId
            );
            let logEntry = `Alarmgruppe ${alarmGroup.name} wurde alarmiert zu ${targetTransferPoint.externalName}!`;

            let remainingVehiclesOffset = 0;

            if (firstVehiclesCount > 0 && firstVehiclesTargetTransferPointId) {
                const firstVehiclesTargetTransferPoint = getElement(
                    draftState,
                    'transferPoint',
                    firstVehiclesTargetTransferPointId
                );
                logEntry += ` Die ersten ${firstVehiclesCount} Fahrzeuge wurden zu ${firstVehiclesTargetTransferPoint.externalName} alarmiert!`;

                for (let i = 0; i < firstVehiclesCount; i++) {
                    sendAlarmGroupVehicle(
                        draftState,
                        sortedVehicleParameters[i]!,
                        sortedAlarmGroupVehicles[i]!.time,
                        alarmGroup.id,
                        firstVehiclesTargetTransferPointId
                    );
                }

                remainingVehiclesOffset = firstVehiclesCount;
            }

            for (
                let i = remainingVehiclesOffset;
                i < sortedVehicleParameters.length;
                i++
            ) {
                sendAlarmGroupVehicle(
                    draftState,
                    sortedVehicleParameters[i]!,
                    sortedAlarmGroupVehicles[i]!.time,
                    alarmGroup.id,
                    targetTransferPointId
                );
            }

            addLogEntry.reducer(draftState, {
                type: '[Emergency Operation Center] Add Log Entry',
                message: logEntry,
                name: clientName,
            });

            logAlarmGroupSent(draftState, alarmGroupId);
            alarmGroup.sent = true;

            return draftState;
        },
        rights: 'trainer',
    };
}

function sendAlarmGroupVehicle(
    draftState: Mutable<ExerciseState>,
    vehicleParameters: VehicleParameters,
    time: number,
    alarmGroupId: UUID,
    targetTransferPointId: UUID
) {
    VehicleActionReducers.addVehicle.reducer(draftState, {
        type: '[Vehicle] Add vehicle',
        vehicleParameters,
    });
    TransferActionReducers.addToTransfer.reducer(draftState, {
        type: '[Transfer] Add to transfer',
        elementType: vehicleParameters.vehicle.type,
        elementId: vehicleParameters.vehicle.id,
        startPoint: cloneDeepMutable(
            AlarmGroupStartPoint.create(alarmGroupId, time)
        ),
        targetTransferPointId,
    });
}

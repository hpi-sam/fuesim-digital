import {
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    Min,
} from 'class-validator';
import { z } from 'zod';
import { WritableDraft } from 'immer';
import type { Action, ActionReducer } from '../action-reducer.js';
import type { ExerciseState } from '../../state.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { newEocLogEntry } from '../../models/eoc-log-entry.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import {
    type VehicleParameters,
    vehicleParametersSchema,
} from '../../models/utils/vehicle-parameters.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import { newAlarmGroupStartPoint } from '../../models/utils/start-points.js';
import { getElement } from './utils/get-element.js';
import { logAlarmGroupSent } from './utils/log.js';
import { TransferActionReducers } from './transfer.js';
import { VehicleActionReducers } from './vehicle.js';

export class AddLogEntryAction implements Action {
    @IsValue('[Emergency Operation Center] Add Log Entry' as const)
    public readonly type = '[Emergency Operation Center] Add Log Entry';
    @IsString()
    @MaxLength(255)
    public readonly name!: string;
    @IsString()
    @MaxLength(65535)
    public readonly message!: string;
    @IsBoolean()
    public readonly isPrivate: boolean = false;
}

export class SendAlarmGroupAction implements Action {
    @IsValue('[Emergency Operation Center] Send Alarm Group' as const)
    public readonly type = '[Emergency Operation Center] Send Alarm Group';

    @IsString()
    @MaxLength(255)
    public readonly clientName!: string;

    @IsUUID(4, uuidValidationOptions)
    public readonly alarmGroupId!: UUID;

    @IsZodSchema(z.array(vehicleParametersSchema))
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
        reducer: (draftState, { name, message, isPrivate }) => {
            const logEntry = newEocLogEntry(
                draftState.currentTime,
                message,
                name,
                isPrivate
            );
            draftState.eocLog.push(logEntry);
            return draftState;
        },
        rights: (client, action) => {
            if (action.isPrivate && client.role.mainRole === 'participant') {
                return false;
            }
            return 'eoc';
        },
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

            const sortedAlarmGroupVehicles = TypeAssertedObject.values(
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

                for (
                    let i = 0;
                    i < firstVehiclesCount &&
                    i < sortedVehicleParameters.length;
                    i++
                ) {
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
                isPrivate: false,
            });

            logAlarmGroupSent(draftState, alarmGroupId);
            alarmGroup.triggerCount += 1;

            return draftState;
        },
        rights: 'eoc',
    };
}

function sendAlarmGroupVehicle(
    draftState: WritableDraft<ExerciseState>,
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
        startPoint: newAlarmGroupStartPoint(alarmGroupId, time),
        targetTransferPointId,
    });
}

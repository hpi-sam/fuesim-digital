import { z } from 'zod';
import type { WritableDraft, Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import type { ExerciseState } from '../../state.js';
import {
    eocLogEntrySchema,
    newEocLogEntry,
} from '../../models/eoc-log-entry.js';
import { type UUID } from '../../utils/uuid.js';
import {
    type VehicleParameters,
    vehicleParametersSchema,
} from '../../models/utils/vehicle-parameters.js';
import { newAlarmGroupStartPoint } from '../../models/utils/start-points.js';
import { alarmGroupSchema } from '../../models/alarm-group.js';
import { transferPointSchema } from '../../models/transfer-point.js';
import { getElement } from './utils/get-element.js';
import { logAlarmGroupSent } from './utils/log.js';
import { TransferActionReducers } from './transfer.js';
import { VehicleActionReducers } from './vehicle.js';

export const addLogEntryActionSchema = z.strictObject({
    type: z.literal('[Emergency Operation Center] Add Log Entry'),
    name: eocLogEntrySchema.shape.clientName,
    message: eocLogEntrySchema.shape.message,
    isPrivate: eocLogEntrySchema.shape.isPrivate,
    id: eocLogEntrySchema.shape.id,
});
export type AddLogEntryAction = Immutable<
    z.infer<typeof addLogEntryActionSchema>
>;

export const sendAlarmGroupActionSchema = z.strictObject({
    type: z.literal('[Emergency Operation Center] Send Alarm Group'),
    clientName: z.string().max(255),
    alarmGroupId: alarmGroupSchema.shape.id,
    sortedVehicleParameters: z.array(vehicleParametersSchema),
    targetTransferPointId: transferPointSchema.shape.id,
    firstVehiclesCount: z.int().nonnegative(),
    firstVehiclesTargetTransferPointId: transferPointSchema.shape.id.optional(),
    eocLogId: eocLogEntrySchema.shape.id,
});
export type SendAlarmGroupAction = Immutable<
    z.infer<typeof sendAlarmGroupActionSchema>
>;

export namespace EmergencyOperationCenterActionReducers {
    export const addLogEntry: ActionReducer<AddLogEntryAction> = {
        type: addLogEntryActionSchema.shape.type.value,
        actionSchema: addLogEntryActionSchema,
        reducer: (draftState, { name, message, isPrivate, id }) => {
            const logEntry = newEocLogEntry(
                id,
                draftState.currentTime,
                message,
                name,
                isPrivate
            );
            draftState.eocLog.push(logEntry);
            return draftState;
        },
        rights: (state, client, action) => {
            if (action.isPrivate && client.role.mainRole === 'participant') {
                return false;
            }
            return 'eoc';
        },
    };
    export const sendAlarmGroup: ActionReducer<SendAlarmGroupAction> = {
        type: sendAlarmGroupActionSchema.shape.type.value,
        actionSchema: sendAlarmGroupActionSchema,
        reducer: (
            draftState,
            {
                clientName,
                alarmGroupId,
                sortedVehicleParameters,
                targetTransferPointId,
                firstVehiclesCount,
                firstVehiclesTargetTransferPointId,
                eocLogId,
            }
        ) => {
            const alarmGroup = getElement(
                draftState,
                'alarmGroup',
                alarmGroupId
            );

            const sortedAlarmGroupVehicles = Object.values(
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
                id: eocLogId,
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
    vehicleParameters: Immutable<VehicleParameters>,
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

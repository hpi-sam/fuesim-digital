import { z } from 'zod';
import {
    changeOccupation,
    newIntermediateOccupation,
} from '../../models/index.js';
import type { UUID, UUIDSet } from '../../utils/index.js';
import { uuidSchema, uuidSetSchema } from '../../utils/index.js';
import { sendSimulationEvent } from '../events/utils.js';
import {
    newPatientTransferToHospitalSuccessfulEvent,
    newTransferPatientsInSpecificVehicleRequestEvent,
} from '../events/index.js';
import { catchAllHospitalId } from '../../data/index.js';
import {
    getElement,
    tryGetElement,
} from '../../store/action-reducers/utils/index.js';
import { getPatientVisibleStatus } from '../../models/patient.js';
import type { SimulationActivity } from './simulation-activity.js';
import { simulationActivityStateSchema } from './simulation-activity.js';

export const transferPatientToHospitalActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('transferPatientToHospitalActivity'),
    patientIds: uuidSetSchema,
    vehicleId: uuidSchema,
    transferManagementRegionId: uuidSchema,
});
export type TransferPatientToHospitalActivityState = z.infer<
    typeof transferPatientToHospitalActivityStateSchema
>;

export function newTransferPatientToHospitalActivityState(
    id: UUID,
    patientIds: UUIDSet,
    vehicleId: UUID,
    transferManagementRegionId: UUID
): TransferPatientToHospitalActivityState {
    return {
        id,
        type: 'transferPatientToHospitalActivity',
        patientIds,
        vehicleId,
        transferManagementRegionId,
    };
}

export const transferPatientToHospitalActivity: SimulationActivity<TransferPatientToHospitalActivityState> =
    {
        activityStateSchema: transferPatientToHospitalActivityStateSchema,
        tick(
            draftState,
            simulatedRegion,
            activityState,
            tickInterval,
            terminate
        ) {
            const vehicle = tryGetElement(
                draftState,
                'vehicle',
                activityState.vehicleId
            );
            if (vehicle?.occupation.type !== 'patientTransferOccupation') {
                terminate();
                return;
            }

            const patients = Object.keys(activityState.patientIds).map(
                (patientId) => getElement(draftState, 'patient', patientId)
            );
            const transferManagementRegion = tryGetElement(
                draftState,
                'simulatedRegion',
                activityState.transferManagementRegionId
            );

            changeOccupation(
                draftState,
                vehicle,
                newIntermediateOccupation(draftState.currentTime + tickInterval)
            );

            sendSimulationEvent(
                simulatedRegion,
                newTransferPatientsInSpecificVehicleRequestEvent(
                    activityState.patientIds,
                    activityState.vehicleId,
                    'hospital',
                    catchAllHospitalId,
                    simulatedRegion.id
                )
            );

            if (transferManagementRegion !== undefined) {
                patients.forEach((patient) => {
                    sendSimulationEvent(
                        transferManagementRegion,
                        newPatientTransferToHospitalSuccessfulEvent(
                            getPatientVisibleStatus(
                                patient,
                                draftState.configuration.pretriageEnabled,
                                draftState.configuration.bluePatientsEnabled
                            ),
                            simulatedRegion.id
                        )
                    );
                });
            }

            terminate();
        },
    };

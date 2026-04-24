import { z } from 'zod';
import { sendSimulationEvent } from '../events/utils.js';
import { getPatientVisibleStatus } from '../../models/patient.js';
import { type UUIDSet, uuidSetSchema } from '../../utils/uuid-set.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import {
    getElement,
    tryGetElement,
} from '../../store/action-reducers/utils/get-element.js';
import { changeOccupation } from '../../models/utils/occupations/occupation-helpers-mutable.js';
import { newIntermediateOccupation } from '../../models/utils/occupations/intermediate-occupation.js';
import { newTransferPatientsInSpecificVehicleRequestEvent } from '../events/transfer-patients-in-specific-vehicle-request.js';
import { catchAllHospitalId } from '../../data/default-state/catch-all-hospital.js';
import { newPatientTransferToHospitalSuccessfulEvent } from '../events/patient-transfer-to-hospital-successful.js';
import { simulationActivityStateSchema } from './simulation-activity.js';
import type { SimulationActivity } from './simulation-activity.js';

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

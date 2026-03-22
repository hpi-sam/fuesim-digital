import { z } from 'zod';
import { groupBy } from 'lodash-es';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { getPatientVisibleStatus } from '../../models/patient.js';
import { sendSimulationEvent } from '../events/utils.js';
import { newPatientsCountedEvent } from '../events/patients-counted.js';
import type { PatientStatus } from '../../models/utils/patient-status.js';
import { patientStatusAllowedValues } from '../../models/utils/patient-status.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { StrictObject } from '../../utils/strict-object.js';
import type { SimulationActivity } from './simulation-activity.js';

export const countPatientsActivityStateSchema = z.strictObject({
    type: z.literal('countPatientsActivity' as const),
    id: uuidSchema,
});
export type CountPatientsActivityState = z.infer<
    typeof countPatientsActivityStateSchema
>;

export function newCountPatientsActivityState(
    id: UUID
): CountPatientsActivityState {
    return { id, type: 'countPatientsActivity' };
}

export const countPatientsActivity: SimulationActivity<CountPatientsActivityState> =
    {
        activityStateSchema: countPatientsActivityStateSchema,
        tick(
            draftState,
            simulatedRegion,
            _activityState,
            _tickInterval,
            terminate
        ) {
            const patients = Object.values(draftState.patients).filter(
                (patient) =>
                    isInSpecificSimulatedRegion(patient, simulatedRegion.id)
            );
            const patientCount = StrictObject.fromEntries(
                StrictObject.entries(
                    groupBy(patients, (patient) =>
                        getPatientVisibleStatus(
                            patient,
                            draftState.configuration.pretriageEnabled,
                            draftState.configuration.bluePatientsEnabled
                        )
                    )
                ).map(([visibleStatus, patientsOfStatus]) => [
                    visibleStatus as PatientStatus,
                    patientsOfStatus.length,
                ])
            );

            patientStatusAllowedValues.forEach((patientStatus) => {
                patientCount[patientStatus] ??= 0;
            });

            sendSimulationEvent(
                simulatedRegion,
                newPatientsCountedEvent(
                    patientCount as ResourceDescription<PatientStatus>
                )
            );

            terminate();
        },
    };

import { IsUUID } from 'class-validator';
import { groupBy } from 'lodash-es';
import { IsValue } from '../../utils/validators/is-value.js';
import type { UUID } from '../../utils/index.js';
import { StrictObject, uuidValidationOptions } from '../../utils/index.js';
import { getCreate } from '../../models/utils/get-create.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { getPatientVisibleStatus } from '../../models/patient.js';
import { sendSimulationEvent } from '../events/utils.js';
import { PatientsCountedEvent } from '../events/patients-counted.js';
import type { PatientStatus } from '../../models/utils/patient-status.js';
import { patientStatusAllowedValues } from '../../models/utils/patient-status.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import type {
    SimulationActivity,
    SimulationActivityState,
} from './simulation-activity.js';

export class CountPatientsActivityState implements SimulationActivityState {
    @IsValue('countPatientsActivity' as const)
    public readonly type = 'countPatientsActivity';

    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(id: UUID) {
        this.id = id;
    }

    static readonly create = getCreate(this);
}

export const countPatientsActivity: SimulationActivity<CountPatientsActivityState> =
    {
        activityState: CountPatientsActivityState,
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
                PatientsCountedEvent.create(
                    patientCount as ResourceDescription<PatientStatus>
                )
            );

            terminate();
        },
    };

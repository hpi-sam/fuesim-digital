import { difference } from 'lodash-es';
import { z } from 'zod';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import { sendSimulationEvent } from '../events/utils.js';
import { completelyLoadVehicle } from '../../store/action-reducers/utils/completely-load-vehicle.js';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import { logVehicle } from '../../store/action-reducers/utils/log.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { type UUIDSet, uuidSetSchema } from '../../utils/uuid-set.js';
import {
    type ExerciseOccupation,
    exerciseOccupationSchema,
} from '../../models/utils/occupations/exercise-occupation.js';
import {
    getElement,
    tryGetElement,
} from '../../store/action-reducers/utils/get-element.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { newPersonnelRemovedEvent } from '../events/personnel-removed.js';
import { newMaterialRemovedEvent } from '../events/material-removed.js';
import { newPatientRemovedEvent } from '../events/patient-removed.js';
import { newSimulatedRegionPositionIn } from '../../models/utils/position/simulated-region-position.js';
import { newNewPatientEvent } from '../events/new-patient.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { newVehiclePositionIn } from '../../models/utils/position/vehicle-position.js';
import { newStartTransferEvent } from '../events/start-transfer.js';
import { createVehicleActionTag } from '../../models/utils/tag-helpers.js';
import { changeOccupation } from '../../models/utils/occupations/occupation-helpers-mutable.js';
import { newIntermediateOccupation } from '../../models/utils/occupations/intermediate-occupation.js';
import { simulationActivityStateSchema } from './simulation-activity.js';
import type { SimulationActivity } from './simulation-activity.js';

export const loadVehicleActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('loadVehicleActivity'),
    vehicleId: uuidSchema,
    transferDestinationType: transferDestinationTypeSchema,
    transferDestinationId: uuidSchema,
    patientsToBeLoaded: uuidSetSchema,
    loadDelay: z.int().nonnegative().optional(),
    loadTimePerPatient: z.int().nonnegative(),
    personnelLoadTime: z.int().nonnegative(),
    key: z.string().optional(),
    hasBeenStarted: z.boolean(),
    startTime: z.int().nonnegative(),
    successorOccupation: exerciseOccupationSchema.optional(),
});
export type LoadVehicleActivityState = z.infer<
    typeof loadVehicleActivityStateSchema
>;

export function newLoadVehicleActivityState(
    id: UUID,
    vehicleId: UUID,
    transferDestinationType: TransferDestination,
    transferDestinationId: UUID,
    patientsToBeLoaded: UUIDSet,
    loadTimePerPatient: number,
    personnelLoadTime: number,
    key?: string,
    successorOccupation?: ExerciseOccupation
): LoadVehicleActivityState {
    return {
        id,
        type: 'loadVehicleActivity',
        vehicleId,
        transferDestinationType,
        transferDestinationId,
        patientsToBeLoaded,
        loadTimePerPatient,
        personnelLoadTime,
        key,
        successorOccupation,
        hasBeenStarted: false,
        startTime: 0,
    };
}
export const loadVehicleActivity: SimulationActivity<LoadVehicleActivityState> =
    {
        activityStateSchema: loadVehicleActivityStateSchema,
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
            if (
                vehicle === undefined ||
                !isInSpecificSimulatedRegion(vehicle, simulatedRegion.id) ||
                vehicle.occupation.type !== 'loadOccupation' ||
                vehicle.occupation.loadingActivityId !== activityState.id
            ) {
                terminate();
                return;
            }

            // Start load process only once
            if (!activityState.hasBeenStarted) {
                // Send remove events

                let personnelToLoadCount = 0;
                Object.keys(vehicle.personnelIds).forEach((personnelId) => {
                    const personnel = getElement(
                        draftState,
                        'personnel',
                        personnelId
                    );
                    if (
                        isInSpecificSimulatedRegion(
                            personnel,
                            simulatedRegion.id
                        )
                    ) {
                        sendSimulationEvent(
                            simulatedRegion,
                            newPersonnelRemovedEvent(personnelId)
                        );
                        personnelToLoadCount++;
                    }
                });
                Object.keys(vehicle.materialIds).forEach((materialId) => {
                    const material = getElement(
                        draftState,
                        'material',
                        materialId
                    );
                    if (
                        isInSpecificSimulatedRegion(
                            material,
                            simulatedRegion.id
                        )
                    ) {
                        sendSimulationEvent(
                            simulatedRegion,
                            newMaterialRemovedEvent(materialId)
                        );
                    }
                });
                Object.keys(activityState.patientsToBeLoaded).forEach(
                    (patientId) => {
                        const patient = getElement(
                            draftState,
                            'patient',
                            patientId
                        );
                        if (
                            isInSpecificSimulatedRegion(
                                patient,
                                simulatedRegion.id
                            )
                        ) {
                            sendSimulationEvent(
                                simulatedRegion,
                                newPatientRemovedEvent(patientId)
                            );
                        }
                    }
                );

                // Load material and personnel

                completelyLoadVehicle(draftState, vehicle);

                // Load patients (and unload patients not to be loaded)

                const patientsToUnload = difference(
                    Object.keys(vehicle.patientIds),
                    Object.keys(activityState.patientsToBeLoaded)
                );
                const patientsToLoad = difference(
                    Object.keys(activityState.patientsToBeLoaded),
                    Object.keys(vehicle.patientIds)
                );

                patientsToUnload.forEach((patientId) => {
                    changePositionWithId(
                        patientId,
                        newSimulatedRegionPositionIn(simulatedRegion.id),
                        'patient',
                        draftState
                    );

                    // Inform the region that a new patient has left the vehicle
                    sendSimulationEvent(
                        simulatedRegion,
                        newNewPatientEvent(patientId)
                    );
                });

                vehicle.patientIds = cloneDeepMutable(
                    activityState.patientsToBeLoaded
                );

                patientsToLoad.forEach((patientId) => {
                    changePositionWithId(
                        patientId,
                        newVehiclePositionIn(vehicle.id),
                        'patient',
                        draftState
                    );
                });

                const patientMovementsCount =
                    patientsToUnload.length + patientsToLoad.length;

                // Personnel has to leave and reenter the vehicle if patients are unloaded or loaded
                const personnelLoadingRequired =
                    personnelToLoadCount > 0 || patientMovementsCount > 0;

                // Calculate loading time based on the patients and personnel to be loaded
                // Do not do the calculation if the time is already set (which could occur if an instance of this activity was imported from an older state version)
                activityState.loadDelay ??=
                    patientMovementsCount * activityState.loadTimePerPatient +
                    (personnelLoadingRequired
                        ? activityState.personnelLoadTime
                        : 0);

                activityState.hasBeenStarted = true;
                activityState.startTime = draftState.currentTime;
            }

            if (
                activityState.loadDelay !== undefined &&
                activityState.startTime + activityState.loadDelay <=
                    draftState.currentTime
            ) {
                sendSimulationEvent(
                    simulatedRegion,
                    newStartTransferEvent(
                        activityState.vehicleId,
                        activityState.transferDestinationType,
                        activityState.transferDestinationId,
                        activityState.key,
                        cloneDeepMutable(activityState.successorOccupation)
                    )
                );

                logVehicle(
                    draftState,
                    [createVehicleActionTag(draftState, 'loaded')],
                    `${vehicle.name} wurde automatisch beladen`,
                    vehicle.id
                );

                changeOccupation(
                    draftState,
                    vehicle,
                    newIntermediateOccupation(
                        draftState.currentTime + tickInterval
                    )
                );

                terminate();
            }
        },
    };

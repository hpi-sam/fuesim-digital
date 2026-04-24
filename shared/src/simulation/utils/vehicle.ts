import type { WritableDraft } from 'immer';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import { logVehicle } from '../../store/action-reducers/utils/log.js';
import { sendSimulationEvent } from '../events/utils.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import type { Vehicle } from '../../models/vehicle.js';
import {
    isInSpecificSimulatedRegion,
    isInSpecificVehicle,
} from '../../models/utils/position/position-helpers.js';
import { createVehicleActionTag } from '../../models/utils/tag-helpers.js';
import { getElement } from '../../store/action-reducers/utils/get-element.js';
import { newSimulatedRegionPositionIn } from '../../models/utils/position/simulated-region-position.js';
import { newMaterialAvailableEvent } from '../events/material-available.js';
import { newPersonnelAvailableEvent } from '../events/personnel-available.js';
import { newNewPatientEvent } from '../events/new-patient.js';

export function unloadVehicle(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    vehicle: WritableDraft<Vehicle>
) {
    if (!isInSpecificSimulatedRegion(vehicle, simulatedRegion.id)) {
        console.error(
            `Trying to unload a vehicle with id ${vehicle.id} into simulated region with id ${simulatedRegion.id} but the vehicle is not in that region.`
        );
        return;
    }

    logVehicle(
        draftState,
        [createVehicleActionTag(draftState, 'unloaded')],
        `${vehicle.name} wurde automatisch entladen`,
        vehicle.id
    );

    const loadedElements = [
        { uuidSet: vehicle.materialIds, elementType: 'material' },
        { uuidSet: vehicle.personnelIds, elementType: 'personnel' },
        { uuidSet: vehicle.patientIds, elementType: 'patient' },
    ] as const;

    for (const { uuidSet, elementType } of loadedElements) {
        for (const elementId of Object.keys(uuidSet)) {
            const element = getElement(draftState, elementType, elementId);
            if (isInSpecificVehicle(element, vehicle.id)) {
                changePositionWithId(
                    elementId,
                    newSimulatedRegionPositionIn(simulatedRegion.id),
                    elementType,
                    draftState
                );

                switch (element.type) {
                    case 'material':
                        sendSimulationEvent(
                            simulatedRegion,
                            newMaterialAvailableEvent(element.id)
                        );
                        break;
                    case 'personnel':
                        sendSimulationEvent(
                            simulatedRegion,
                            newPersonnelAvailableEvent(element.id)
                        );
                        break;
                    case 'patient':
                        sendSimulationEvent(
                            simulatedRegion,
                            newNewPatientEvent(element.id)
                        );
                        break;
                }
            }
        }
    }
    vehicle.patientIds = {};
}

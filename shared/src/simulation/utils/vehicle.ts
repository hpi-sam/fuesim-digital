import type { WritableDraft } from 'immer';
import type { SimulatedRegion, Vehicle } from '../../models/index.js';
import {
    newSimulatedRegionPositionIn,
    createVehicleActionTag,
    isInSpecificSimulatedRegion,
    isInSpecificVehicle,
} from '../../models/index.js';
import { changePositionWithId } from '../../models/utils/position/position-helpers-mutable.js';
import type { ExerciseState } from '../../state.js';
import { getElement } from '../../store/action-reducers/utils/index.js';
import { logVehicle } from '../../store/action-reducers/utils/log.js';
import {
    NewPatientEvent,
    MaterialAvailableEvent,
    PersonnelAvailableEvent,
} from '../events/index.js';
import { sendSimulationEvent } from '../events/utils.js';

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
                            MaterialAvailableEvent.create(element.id)
                        );
                        break;
                    case 'personnel':
                        sendSimulationEvent(
                            simulatedRegion,
                            PersonnelAvailableEvent.create(element.id)
                        );
                        break;
                    case 'patient':
                        sendSimulationEvent(
                            simulatedRegion,
                            NewPatientEvent.create(element.id)
                        );
                        break;
                }
            }
        }
    }
    vehicle.patientIds = {};
}

import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import { ExpectedReducerError, ReducerError } from '../reducer-error.js';
import { transferPointSchema } from '../../models/transfer-point.js';
import { uuidSchema } from '../../utils/uuid.js';
import {
    exerciseSimulationBehaviorStateSchema,
    simulationBehaviorDictionary,
} from '../../simulation/behaviors/exercise-simulation-behavior.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import { sendSimulationEvent } from '../../simulation/events/utils.js';
import { newVehicleArrivedEvent } from '../../simulation/events/vehicle-arrived.js';
import { newNewPatientEvent } from '../../simulation/events/new-patient.js';
import { newPersonnelAvailableEvent } from '../../simulation/events/personnel-available.js';
import { newMaterialAvailableEvent } from '../../simulation/events/material-available.js';
import { simulatedRegionSchema } from '../../models/simulated-region.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { newSimulatedRegionPositionIn } from '../../models/utils/position/simulated-region-position.js';
import { simulationBehaviorStateSchema } from '../../simulation/behaviors/simulation-behavior.js';
import { TransferPointActionReducers } from './transfer-point.js';
import { isCompletelyLoaded } from './utils/completely-load-vehicle.js';
import {
    logBehaviorAdded,
    logBehaviorRemoved,
    logSimulatedRegionAddElement,
    logSimulatedRegionNameChange,
} from './utils/log.js';
import { getElement, getElementByPredicate } from './utils/get-element.js';

const addSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[SimulatedRegion] Add simulated region'),
    simulatedRegion: simulatedRegionSchema,
    transferPoint: transferPointSchema,
});
export type AddSimulatedRegionAction = Immutable<
    z.infer<typeof addSimulatedRegionActionSchema>
>;

const removeSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[SimulatedRegion] Remove simulated region'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
});
export type RemoveSimulatedRegionAction = Immutable<
    z.infer<typeof removeSimulatedRegionActionSchema>
>;

const moveSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[SimulatedRegion] Move simulated region'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
});
export type MoveSimulatedRegionAction = Immutable<
    z.infer<typeof moveSimulatedRegionActionSchema>
>;

const resizeSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[SimulatedRegion] Resize simulated region'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
    newSize: simulatedRegionSchema.shape.size,
});
export type ResizeSimulatedRegionAction = Immutable<
    z.infer<typeof resizeSimulatedRegionActionSchema>
>;

const renameSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[SimulatedRegion] Rename simulated region'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    newName: simulatedRegionSchema.shape.name,
});
export type RenameSimulatedRegionAction = Immutable<
    z.infer<typeof renameSimulatedRegionActionSchema>
>;

const addElementToSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[SimulatedRegion] Add Element'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    elementToBeAddedType: z.enum([
        'material',
        'patient',
        'personnel',
        'vehicle',
    ]),
    elementToBeAddedId: uuidSchema,
});
export type AddElementToSimulatedRegionAction = Immutable<
    z.infer<typeof addElementToSimulatedRegionActionSchema>
>;

const addBehaviorToSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[SimulatedRegion] Add Behavior'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorState: exerciseSimulationBehaviorStateSchema,
});
export type AddBehaviorToSimulatedRegionAction = Immutable<
    z.infer<typeof addBehaviorToSimulatedRegionActionSchema>
>;

const removeBehaviorFromSimulatedRegionActionSchema = z.strictObject({
    type: z.literal('[SimulatedRegion] Remove Behavior'),
    simulatedRegionId: simulatedRegionSchema.shape.id,
    behaviorId: simulationBehaviorStateSchema.shape.id,
});
export type RemoveBehaviorFromSimulatedRegionAction = Immutable<
    z.infer<typeof removeBehaviorFromSimulatedRegionActionSchema>
>;

export namespace SimulatedRegionActionReducers {
    export const addSimulatedRegion: ActionReducer<AddSimulatedRegionAction> = {
        type: addSimulatedRegionActionSchema.shape.type.value,
        actionSchema: addSimulatedRegionActionSchema,
        reducer: (draftState, { simulatedRegion, transferPoint }) => {
            TransferPointActionReducers.addTransferPoint.reducer(draftState, {
                type: '[TransferPoint] Add TransferPoint',
                transferPoint,
            });
            draftState.simulatedRegions[simulatedRegion.id] =
                cloneDeepMutable(simulatedRegion);
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeSimulatedRegion: ActionReducer<RemoveSimulatedRegionAction> =
        {
            type: removeSimulatedRegionActionSchema.shape.type.value,
            actionSchema: removeSimulatedRegionActionSchema,
            reducer: (draftState, { simulatedRegionId }) => {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const transferPoint = getElementByPredicate(
                    draftState,
                    'transferPoint',
                    (element) =>
                        isInSpecificSimulatedRegion(element, simulatedRegion.id)
                );
                TransferPointActionReducers.removeTransferPoint.reducer(
                    draftState,
                    {
                        type: '[TransferPoint] Remove TransferPoint',
                        transferPointId: transferPoint.id,
                    }
                );
                delete draftState.simulatedRegions[simulatedRegionId];
                return draftState;
            },
            rights: 'trainer',
        };

    export const moveSimulatedRegion: ActionReducer<MoveSimulatedRegionAction> =
        {
            type: moveSimulatedRegionActionSchema.shape.type.value,
            actionSchema: moveSimulatedRegionActionSchema,
            reducer: (draftState, { simulatedRegionId, targetPosition }) => {
                changePositionWithId(
                    simulatedRegionId,
                    newMapPositionAt(targetPosition),
                    'simulatedRegion',
                    draftState
                );
                return draftState;
            },
            rights: 'trainer',
        };

    export const resizeSimulatedRegion: ActionReducer<ResizeSimulatedRegionAction> =
        {
            type: resizeSimulatedRegionActionSchema.shape.type.value,
            actionSchema: resizeSimulatedRegionActionSchema,
            reducer: (
                draftState,
                { simulatedRegionId, targetPosition, newSize }
            ) => {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                changePosition(
                    simulatedRegion,
                    newMapPositionAt(targetPosition),
                    draftState
                );
                simulatedRegion.size = cloneDeepMutable(newSize);
                return draftState;
            },
            rights: 'trainer',
        };

    export const renameSimulatedRegion: ActionReducer<RenameSimulatedRegionAction> =
        {
            type: renameSimulatedRegionActionSchema.shape.type.value,
            actionSchema: renameSimulatedRegionActionSchema,
            reducer: (draftState, { simulatedRegionId, newName }) => {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const transferPoint = getElementByPredicate(
                    draftState,
                    'transferPoint',
                    (element) =>
                        isInSpecificSimulatedRegion(element, simulatedRegion.id)
                );
                TransferPointActionReducers.renameTransferPoint.reducer(
                    draftState,
                    {
                        type: '[TransferPoint] Rename TransferPoint',
                        transferPointId: transferPoint.id,
                        externalName: `[Simuliert] ${newName}`,
                    }
                );
                logSimulatedRegionNameChange(
                    draftState,
                    simulatedRegionId,
                    newName
                );
                simulatedRegion.name = newName;
                return draftState;
            },
            rights: 'trainer',
        };

    export const addElementToSimulatedRegion: ActionReducer<AddElementToSimulatedRegionAction> =
        {
            type: addElementToSimulatedRegionActionSchema.shape.type.value,
            actionSchema: addElementToSimulatedRegionActionSchema,
            reducer: (
                draftState,
                { simulatedRegionId, elementToBeAddedId, elementToBeAddedType }
            ) => {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const element = getElement(
                    draftState,
                    elementToBeAddedType,
                    elementToBeAddedId
                );

                if (
                    element.type === 'vehicle' &&
                    !isCompletelyLoaded(draftState, element)
                ) {
                    throw new ExpectedReducerError(
                        'Das Fahrzeug kann nur in die simulierte Region verschoben werden, wenn Personal und Material eingestiegen sind.'
                    );
                }

                logSimulatedRegionAddElement(
                    draftState,
                    simulatedRegionId,
                    elementToBeAddedId,
                    elementToBeAddedType
                );

                changePosition(
                    element,
                    newSimulatedRegionPositionIn(simulatedRegionId),
                    draftState
                );

                switch (element.type) {
                    case 'vehicle':
                        sendSimulationEvent(
                            simulatedRegion,
                            newVehicleArrivedEvent(
                                element.id,
                                draftState.currentTime
                            )
                        );
                        break;
                    case 'patient':
                        sendSimulationEvent(
                            simulatedRegion,
                            newNewPatientEvent(element.id)
                        );
                        break;
                    case 'personnel':
                        sendSimulationEvent(
                            simulatedRegion,
                            newPersonnelAvailableEvent(element.id)
                        );
                        break;
                    case 'material':
                        sendSimulationEvent(
                            simulatedRegion,
                            newMaterialAvailableEvent(element.id)
                        );
                        break;
                }

                return draftState;
            },
            rights: 'participant',
        };

    export const addBehaviorToSimulatedRegion: ActionReducer<AddBehaviorToSimulatedRegionAction> =
        {
            type: addBehaviorToSimulatedRegionActionSchema.shape.type.value,
            actionSchema: addBehaviorToSimulatedRegionActionSchema,
            reducer: (draftState, { simulatedRegionId, behaviorState }) => {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                simulatedRegion.behaviors.push(cloneDeepMutable(behaviorState));

                logBehaviorAdded(
                    draftState,
                    simulatedRegionId,
                    behaviorState.id
                );

                return draftState;
            },
            rights: 'trainer',
        };

    export const removeBehaviorFromSimulatedRegion: ActionReducer<RemoveBehaviorFromSimulatedRegionAction> =
        {
            type: removeBehaviorFromSimulatedRegionActionSchema.shape.type
                .value,
            actionSchema: removeBehaviorFromSimulatedRegionActionSchema,
            reducer: (draftState, { simulatedRegionId, behaviorId }) => {
                const simulatedRegion = getElement(
                    draftState,
                    'simulatedRegion',
                    simulatedRegionId
                );
                const index = simulatedRegion.behaviors.findIndex(
                    (behavior) => behavior.id === behaviorId
                );

                if (index === -1) {
                    throw new ReducerError(
                        `The simulated region with id ${simulatedRegionId} has no behavior with id ${behaviorId}. Therefore it could not be removed.`
                    );
                }

                logBehaviorRemoved(draftState, simulatedRegionId, behaviorId);

                const behaviorState = simulatedRegion.behaviors[index]!;
                if (simulationBehaviorDictionary[behaviorState.type].onRemove) {
                    simulationBehaviorDictionary[behaviorState.type].onRemove!(
                        draftState,
                        simulatedRegion,
                        behaviorState as any
                    );
                }

                simulatedRegion.behaviors.splice(index, 1);
                return draftState;
            },
            rights: 'trainer',
        };
}

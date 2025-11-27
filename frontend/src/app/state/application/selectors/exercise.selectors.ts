import type { MemoizedSelector } from '@ngrx/store';
import { createSelector } from '@ngrx/store';
import type {
    ExerciseRadiogram,
    ExerciseSimulationActivityState,
    ExerciseSimulationActivityType,
    ExerciseSimulationBehaviorState,
    ExerciseSimulationBehaviorType,
    ExerciseState,
    UUID,
    WithPosition,
} from 'digital-fuesim-manv-shared';
import {
    isInSpecificSimulatedRegion,
    isInTransfer,
    nestedCoordinatesOf,
} from 'digital-fuesim-manv-shared';
import type { TransferLine } from 'src/app/shared/types/transfer-line';
import type { AppState } from '../../app.state';

// Properties

/**
 * Check before via selectExerciseStateMode whether the exerciseState is defined
 */
export const selectExerciseState = (state: AppState) =>
    // TODO: we currently expect this to only be used of the exerciseStateMode is not undefined
    state.application.exerciseState!;

function selectPropertyFactory<Key extends keyof ExerciseState>(key: Key) {
    return createSelector(selectExerciseState, (exercise) => exercise[key]);
}

// UUIDMap properties
export const selectViewports = selectPropertyFactory('viewports');
export const selectSimulatedRegions = selectPropertyFactory('simulatedRegions');
export const selectMapImages = selectPropertyFactory('mapImages');
export const selectPatients = selectPropertyFactory('patients');
export const selectVehicles = selectPropertyFactory('vehicles');
export const selectPersonnel = selectPropertyFactory('personnel');
export const selectAlarmGroups = selectPropertyFactory('alarmGroups');
export const selectMaterials = selectPropertyFactory('materials');
export const selectTransferPoints = selectPropertyFactory('transferPoints');
export const selectHospitals = selectPropertyFactory('hospitals');
export const selectHospitalPatients = selectPropertyFactory('hospitalPatients');
export const selectClients = selectPropertyFactory('clients');
export const selectRadiograms = selectPropertyFactory('radiograms');
// Array properties
export const selectVehicleTemplates = selectPropertyFactory('vehicleTemplates');
export const selectPersonnelTemplates =
    selectPropertyFactory('personnelTemplates');
export const selectMaterialTemplates =
    selectPropertyFactory('materialTemplates');
export const selectMapImagesTemplates =
    selectPropertyFactory('mapImageTemplates');
export const selectPatientCategories =
    selectPropertyFactory('patientCategories');
// Misc properties
export const selectConfiguration = selectPropertyFactory('configuration');
export const selectEocLogEntries = selectPropertyFactory('eocLog');
export const selectExerciseStatus = selectPropertyFactory('currentStatus');
export const selectParticipantId = selectPropertyFactory('participantId');
export const selectCurrentTime = selectPropertyFactory('currentTime');

// Elements

function createSelectElementFromMapFactory<Element>(
    elementsSelector: (state: AppState) => { [key: UUID]: Element }
) {
    return (id: UUID) =>
        createSelector(elementsSelector, (elements) => elements[id]!);
}

// Element from UUIDMap
export const createSelectAlarmGroup =
    createSelectElementFromMapFactory(selectAlarmGroups);
export const createSelectPersonnel =
    createSelectElementFromMapFactory(selectPersonnel);
export const createSelectMaterial =
    createSelectElementFromMapFactory(selectMaterials);
export const createSelectPatient =
    createSelectElementFromMapFactory(selectPatients);
export const createSelectVehicle =
    createSelectElementFromMapFactory(selectVehicles);
export const createSelectMapImage =
    createSelectElementFromMapFactory(selectMapImages);
export const createSelectTransferPoint =
    createSelectElementFromMapFactory(selectTransferPoints);
export const createSelectHospital =
    createSelectElementFromMapFactory(selectHospitals);
export const createSelectViewport =
    createSelectElementFromMapFactory(selectViewports);
export const createSelectSimulatedRegion = createSelectElementFromMapFactory(
    selectSimulatedRegions
);
export const createSelectClient =
    createSelectElementFromMapFactory(selectClients);
export function createSelectRadiogram<R extends ExerciseRadiogram>(id: UUID) {
    return createSelector(
        selectRadiograms,
        (radiograms) => radiograms[id] as R
    );
}
export const createSelectMaterialTemplate = createSelectElementFromMapFactory(
    selectMaterialTemplates
);
export const createSelectPersonnelTemplate = createSelectElementFromMapFactory(
    selectPersonnelTemplates
);

function createSelectElementFromArrayFactory<Element extends { id: UUID }>(
    elementsSelector: (state: AppState) => readonly Element[]
) {
    return (id: UUID) =>
        createSelector(
            elementsSelector,
            (elements) => elements.find((element) => element.id === id)!
        );
}

// Element from Array
export const createSelectMapImageTemplate = createSelectElementFromArrayFactory(
    selectMapImagesTemplates
);
export const createSelectVehicleTemplate = createSelectElementFromArrayFactory(
    selectVehicleTemplates
);

// Misc selectors

export const selectTileMapProperties = createSelector(
    selectConfiguration,
    (configuration) => configuration.tileMapProperties
);

export const selectTransferLines = createSelector(
    selectExerciseState,
    selectTransferPoints,
    (state, transferPoints) =>
        Object.values(transferPoints)
            .flatMap((transferPoint) =>
                Object.entries(transferPoint.reachableTransferPoints).map(
                    ([connectedId, { duration }]) => ({
                        id: `${transferPoint.id}:${connectedId}` as const,
                        startPosition: nestedCoordinatesOf(
                            transferPoint,
                            state
                        ),
                        endPosition: nestedCoordinatesOf(
                            transferPoints[connectedId]!,
                            state
                        ),
                        duration,
                    })
                )
            )
            .reduce<{ [id: string]: TransferLine }>(
                (transferLines, transferLine) => {
                    transferLines[transferLine.id] = transferLine;
                    return transferLines;
                },
                {}
            )
);

export function createSelectReachableTransferPoints(transferPointId: UUID) {
    return createSelector(
        selectTransferPoints,
        createSelectTransferPoint(transferPointId),
        (transferPoints, transferPoint) =>
            Object.keys(transferPoint.reachableTransferPoints).map(
                (id) => transferPoints[id]!
            )
    );
}

export function createSelectReachableHospitals(transferPointId: UUID) {
    return createSelector(
        selectHospitals,
        createSelectTransferPoint(transferPointId),
        (hospitals, transferPoint) =>
            Object.keys(transferPoint.reachableHospitals).map(
                (id) => hospitals[id]!
            )
    );
}

export const selectVehiclesInTransfer = createSelector(
    selectVehicles,
    (vehicles) =>
        Object.values(vehicles).filter((vehicle) => isInTransfer(vehicle))
);

export const selectPersonnelInTransfer = createSelector(
    selectPersonnel,
    (personnel) =>
        Object.values(personnel).filter((_personnel) =>
            isInTransfer(_personnel)
        )
);

export function createSelectElementsInSimulatedRegion<E extends WithPosition>(
    elementsSelector: (state: AppState) => { [key: UUID]: E },
    simulatedRegionId: UUID
) {
    return createSelector(
        createSelectSimulatedRegion(simulatedRegionId),
        elementsSelector,
        (simulatedRegion, elements) =>
            Object.values(elements).filter((e) =>
                isInSpecificSimulatedRegion(e, simulatedRegion.id)
            )
    );
}

export function createSelectByPredicate<E extends WithPosition>(
    selector: MemoizedSelector<AppState, E[]>,
    predicate: (e: E) => boolean
) {
    return createSelector(selector, (elements) =>
        elements.filter((element) => predicate(element))
    );
}

export function createSelectBehaviorStates(simulatedRegionId: UUID) {
    return createSelector(
        createSelectSimulatedRegion(simulatedRegionId),
        (simulatedRegion) => simulatedRegion.behaviors
    );
}

export function createSelectActivityStates(simulatedRegionId: UUID) {
    return createSelector(
        createSelectSimulatedRegion(simulatedRegionId),
        (simulatedRegion) => simulatedRegion.activities
    );
}

export function createSelectBehaviorState<
    B extends ExerciseSimulationBehaviorState,
>(simulatedRegionId: UUID, behaviorId: UUID) {
    return createSelector(
        createSelectBehaviorStates(simulatedRegionId),
        (behaviors) =>
            behaviors.find((behavior) => behavior.id === behaviorId) as B
    );
}

export function createSelectActivityState<
    A extends ExerciseSimulationActivityState,
>(simulatedRegionId: UUID, activityId: UUID) {
    return createSelector(
        createSelectActivityStates(simulatedRegionId),
        (activities) => activities[activityId] as A
    );
}

export function createSelectBehaviorStatesByType<
    T extends ExerciseSimulationBehaviorType,
>(simulatedRegionId: UUID, behaviorType: T) {
    return createSelector(
        createSelectBehaviorStates(simulatedRegionId),
        (behaviors) =>
            behaviors.filter(
                (behavior): behavior is ExerciseSimulationBehaviorState<T> =>
                    behavior.type === behaviorType
            )
    );
}

export function createSelectActivityStatesByType<
    T extends ExerciseSimulationActivityType,
>(simulatedRegionId: UUID, activityType: T) {
    return createSelector(
        createSelectActivityStates(simulatedRegionId),
        (activities) =>
            Object.values(activities).filter(
                (activity): activity is ExerciseSimulationActivityState<T> =>
                    activity.type === activityType
            )
    );
}

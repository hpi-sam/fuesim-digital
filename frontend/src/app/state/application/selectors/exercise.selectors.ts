import type { MemoizedSelector } from '@ngrx/store';
import { createSelector } from '@ngrx/store';
import type {
    ExerciseRadiogram,
    ExerciseSimulationActivityState,
    ExerciseSimulationActivityType,
    ExerciseSimulationBehaviorState,
    ExerciseSimulationBehaviorType,
    ExerciseState,
    ScoutableElementType,
    TechnicalChallengeId,
    UUID,
    Vehicle,
    WithPosition,
} from 'fuesim-digital-shared';
import {
    scoutableElementKeys,
    currentStateOf,
    isInSpecificSimulatedRegion,
    isInTransfer,
    nestedCoordinatesOf,
} from 'fuesim-digital-shared';
import type { AppState } from '../../app.state';
import type { TransferLine } from '../../../shared/types/transfer-line';
import { elementTypePluralMap } from '../../../../../../shared/dist/utils/element-type-plural-map';

// Properties

/**
 * Check before via selectExerciseStateMode whether the exerciseState is defined
 */
export function selectExerciseState(state: AppState) {
    // TODO: we currently expect this to only be used of the exerciseStateMode is not undefined
    return state.application.exerciseState!;
}

function selectPropertyFactory<Key extends keyof ExerciseState>(key: Key) {
    return createSelector(selectExerciseState, (exercise) => exercise[key]);
}

export const scoutableElementSelectors = scoutableElementKeys.map((key) =>
    selectPropertyFactory(elementTypePluralMap[key])
);

// UUIDMap properties
export const selectViewports = selectPropertyFactory('viewports');
export const selectSimulatedRegions = selectPropertyFactory('simulatedRegions');
export const selectMapImages = selectPropertyFactory('mapImages');
export const selectPatients = selectPropertyFactory('patients');
export const selectVehicles = selectPropertyFactory('vehicles');
export const selectPersonnel = selectPropertyFactory('personnel');
export const selectAlarmGroups = selectPropertyFactory('alarmGroups');
export const selectMaterials = selectPropertyFactory('materials');
export const selectTasks = selectPropertyFactory('tasks');
export const selectTransferPoints = selectPropertyFactory('transferPoints');
export const selectHospitals = selectPropertyFactory('hospitals');
export const selectHospitalPatients = selectPropertyFactory('hospitalPatients');
export const selectClients = selectPropertyFactory('clients');
export const selectRadiograms = selectPropertyFactory('radiograms');
export const selectRestrictedZones = selectPropertyFactory('restrictedZones');
export const selectOperationalSections = selectPropertyFactory(
    'operationalSections'
);
export const selectTechnicalChallenges = selectPropertyFactory(
    'technicalChallenges'
);
export const selectVehicleTemplates = selectPropertyFactory('vehicleTemplates');
export const selectPersonnelTemplates =
    selectPropertyFactory('personnelTemplates');
export const selectMaterialTemplates =
    selectPropertyFactory('materialTemplates');
export const selectMapImagesTemplates =
    selectPropertyFactory('mapImageTemplates');
// Array properties
export const selectPatientCategories =
    selectPropertyFactory('patientCategories');
// Misc properties
export const selectConfiguration = selectPropertyFactory('configuration');
export const selectEocLogEntries = selectPropertyFactory('eocLog');
export const selectExerciseStatus = selectPropertyFactory('currentStatus');
export const selectParticipantKey = selectPropertyFactory('participantKey');
export const selectCurrentTime = selectPropertyFactory('currentTime');
export const selectExerciseType = selectPropertyFactory('type');
export const selectCollectedClientNames = selectPropertyFactory(
    'collectedClientNames'
);
export const selectScoutables = selectPropertyFactory('scoutables');

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
export const createSelectTask = createSelectElementFromMapFactory(selectTasks);
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
export const createSelectRestrictedZone = createSelectElementFromMapFactory(
    selectRestrictedZones
);
export const createSelectSimulatedRegion = createSelectElementFromMapFactory(
    selectSimulatedRegions
);
export const createSelectTechnicalChallenge = createSelectElementFromMapFactory(
    selectTechnicalChallenges
);
export const createSelectClient =
    createSelectElementFromMapFactory(selectClients);
export const createSelectVehicleTemplate = createSelectElementFromMapFactory(
    selectVehicleTemplates
);
export const createSelectMaterialTemplate = createSelectElementFromMapFactory(
    selectMaterialTemplates
);
export const createSelectPersonnelTemplate = createSelectElementFromMapFactory(
    selectPersonnelTemplates
);
export const createSelectMapImageTemplate = createSelectElementFromMapFactory(
    selectMapImagesTemplates
);
export const createSelectScoutable =
    createSelectElementFromMapFactory(selectScoutables);
export function createSelectRadiogram<R extends ExerciseRadiogram>(id: UUID) {
    return createSelector(
        selectRadiograms,
        (radiograms) => radiograms[id] as R
    );
}

export const scoutableElementTypeSelectorMap: {
    [key in ScoutableElementType]: (
        id: string
    ) => MemoizedSelector<AppState, any, any>;
} = {
    patient: createSelectPatient,
    mapImage: createSelectMapImage,
};

// Misc selectors

export const selectTileMapProperties = createSelector(
    selectConfiguration,
    (configuration) => configuration.tileMapProperties
);

export const selectOperationsMapProperties = createSelector(
    selectConfiguration,
    (configuration) => configuration.operationsMapProperties
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

export function createSelectVehiclesInOperationalSection(
    operationalSectionId: UUID
) {
    return createSelector(selectVehicles, (vehicles) =>
        Object.values(vehicles).filter(
            (vehicle) =>
                vehicle.operationalAssignment?.type === 'operationalSection' &&
                vehicle.operationalAssignment.sectionId === operationalSectionId
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

export const selectLocalOperationsCommand = createSelector(
    selectVehicles,
    (vehicles) =>
        Object.values(vehicles).find(
            (v) => v.operationalAssignment?.type === 'localOperationsCommand'
        )
);

export function createSelectOperationalSectionLeader(sectionId: string) {
    return createSelector(
        createSelectVehiclesInOperationalSection(sectionId),
        (vehicles) =>
            Object.values(vehicles)
                .filter(
                    (vehicle) =>
                        vehicle.operationalAssignment?.type ===
                            'operationalSection' &&
                        vehicle.operationalAssignment.role ===
                            'operationalSectionLeader'
                )
                .at(0)
    );
}

export function createSelectOperationalSectionMembers(sectionId: string) {
    return createSelector(
        createSelectVehiclesInOperationalSection(sectionId),
        (vehicles) =>
            Object.values(vehicles).filter(
                // This type annotation is necessary to not have to repeat the same conditions later
                (
                    vehicle
                ): vehicle is Vehicle & {
                    operationalAssignment: NonNullable<
                        Vehicle['operationalAssignment']
                    > & {
                        role: 'operationalSectionMember';
                        position: number;
                    };
                } =>
                    vehicle.operationalAssignment?.type ===
                        'operationalSection' &&
                    vehicle.operationalAssignment.role ===
                        'operationalSectionMember'
            )
    );
}

export function createSelectSortedOperationalSectionMembers(sectionId: string) {
    return createSelector(
        createSelectOperationalSectionMembers(sectionId),
        (vehicles) =>
            vehicles.sort(
                (a, b) =>
                    a.operationalAssignment.position -
                    b.operationalAssignment.position
            )
    );
}

export const selectVehiclesInTransferFromAlarmgroup = createSelector(
    selectVehiclesInTransfer,
    (vehicles) =>
        Object.values(vehicles).filter(
            (vehicle) =>
                vehicle.position.type === 'transfer' &&
                vehicle.position.transfer.startPoint.type ===
                    'alarmGroupStartPoint'
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
                (
                    behavior
                ): behavior is ExerciseSimulationBehaviorState & { type: T } =>
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
                (
                    activity
                ): activity is ExerciseSimulationActivityState & { type: T } =>
                    activity.type === activityType
            )
    );
}

function createSelectAvailableTaskIds(
    technicalChallengeId: TechnicalChallengeId
) {
    return createSelector(
        createSelectTechnicalChallenge(technicalChallengeId),
        (challenge) => Object.keys(currentStateOf(challenge).possibleTasks)
    );
}
export function createSelectAvailableTasks(
    technicalChallengeId: TechnicalChallengeId
) {
    return createSelector(
        createSelectAvailableTaskIds(technicalChallengeId),
        selectTasks,
        (taskIds, taskMap) => taskIds.map((id) => taskMap[id]!)
    );
}

export const selectWorkingPersonnel = createSelector(
    selectTechnicalChallenges,
    (challenges) => {
        const workingPersonnel = new Set<UUID>();
        for (const challenge of Object.values(challenges)) {
            for (const personnelId of Object.keys(
                challenge.assignedPersonnel
            )) {
                workingPersonnel.add(personnelId);
            }
        }
        return workingPersonnel;
    }
);

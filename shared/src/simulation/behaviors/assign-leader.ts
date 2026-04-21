import { groupBy } from 'lodash-es';
import type { WritableDraft } from 'immer';
import { z } from 'zod';
import { StrictObject } from '../../utils/strict-object.js';
import {
    getActivityById,
    getElement,
    getElementByPredicate,
} from '../../store/action-reducers/utils/get-element.js';
import type { VehicleOccupationsRadiogram } from '../../models/radiogram/vehicle-occupations-radiogram.js';
import {
    currentSimulatedRegionIdOf,
    isInSimulatedRegion,
    isInSpecificSimulatedRegion,
} from '../../models/utils/position/position-helpers.js';
import type { ExerciseState } from '../../state.js';
import type { SimulatedRegion } from '../../models/simulated-region.js';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';
import { addActivity } from '../activities/utils.js';
import { newDelayEventActivityState } from '../activities/delay-event.js';
import { nextUUID } from '../utils/randomness.js';
import { newLeaderChangedEvent } from '../events/leader-changed.js';
import type { MaterialCountRadiogram } from '../../models/radiogram/material-count-radiogram.js';
import type { PersonnelCountRadiogram } from '../../models/radiogram/personnel-count-radiogram.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import type { TransferConnectionsRadiogram } from '../../models/radiogram/transfer-connections-radiogram.js';
import type { VehicleCountRadiogram } from '../../models/radiogram/vehicle-count-radiogram.js';
import {
    type SimulationBehavior,
    simulationBehaviorStateSchema,
} from './simulation-behavior.js';

export const assignLeaderBehaviorStateSchema = z.strictObject({
    ...simulationBehaviorStateSchema.shape,
    type: z.literal('assignLeaderBehavior'),
    leaderId: uuidSchema.optional(),
});

export type AssignLeaderBehaviorState = z.infer<
    typeof assignLeaderBehaviorStateSchema
>;

export function newAssignLeaderBehaviorState(): AssignLeaderBehaviorState {
    return {
        type: 'assignLeaderBehavior',
        id: uuid(),
        leaderId: undefined,
    };
}

const personnelPriorities: { [key in string]: number } = {
    notarzt: 0,
    san: 1,
    rettSan: 2,
    notSan: 3,
    gf: 4,
};

export const assignLeaderBehavior: SimulationBehavior<AssignLeaderBehaviorState> =
    {
        behaviorStateSchema: assignLeaderBehaviorStateSchema,
        newBehaviorState: newAssignLeaderBehaviorState,
        handleEvent(draftState, simulatedRegion, behaviorState, event) {
            switch (event.type) {
                case 'personnelAvailableEvent':
                    {
                        // If a gf (group leader of GW San) enters the region, we want to assign them as leader, since a gf can't treat patients
                        // A gf has the highest priority, so they would be chosen by the logic for the tick event anyways
                        // Therefore, this branch only serves the purpose to switch the leader
                        if (!behaviorState.leaderId) {
                            return;
                        }

                        const currentLeader = getElement(
                            draftState,
                            'personnel',
                            behaviorState.leaderId
                        );

                        if (currentLeader.personnelType === 'gf') {
                            return;
                        }

                        const newPersonnel = getElement(
                            draftState,
                            'personnel',
                            event.personnelId
                        );

                        if (newPersonnel.personnelType === 'gf') {
                            changeLeader(
                                draftState,
                                simulatedRegion,
                                behaviorState,
                                event.personnelId
                            );
                        }
                    }
                    break;
                case 'tickEvent':
                    {
                        if (!behaviorState.leaderId) {
                            selectNewLeader(
                                draftState,
                                simulatedRegion,
                                behaviorState,
                                false
                            );
                        }
                    }
                    break;
                case 'personnelRemovedEvent':
                    {
                        // if the leader is removed from the region a new leader is selected
                        if (event.personnelId === behaviorState.leaderId) {
                            selectNewLeader(
                                draftState,
                                simulatedRegion,
                                behaviorState,
                                true
                            );
                        }
                    }
                    break;
                case 'collectInformationEvent':
                    // This behavior answerers queries because the leader typically holds the respective information
                    {
                        // If there is no leader queries cant be answered
                        if (!behaviorState.leaderId) {
                            return;
                        }

                        switch (event.informationType) {
                            case 'materialCount':
                                {
                                    const radiogram = getActivityById(
                                        draftState,
                                        simulatedRegion.id,
                                        event.generateReportActivityId,
                                        'generateReportActivity'
                                    )
                                        .radiogram as WritableDraft<MaterialCountRadiogram>;
                                    const materials = Object.values(
                                        draftState.materials
                                    ).filter((material) =>
                                        isInSpecificSimulatedRegion(
                                            material,
                                            simulatedRegion.id
                                        )
                                    );
                                    radiogram.materialForPatients.red =
                                        materials
                                            .map(
                                                (material) =>
                                                    material.canCaterFor.red
                                            )
                                            .reduce((a, b) => a + b, 0);
                                    radiogram.materialForPatients.yellow =
                                        materials
                                            .map(
                                                (material) =>
                                                    material.canCaterFor.yellow
                                            )
                                            .reduce((a, b) => a + b, 0);
                                    radiogram.materialForPatients.green =
                                        materials
                                            .map(
                                                (material) =>
                                                    material.canCaterFor.green
                                            )
                                            .reduce((a, b) => a + b, 0);

                                    radiogram.informationAvailable = true;
                                }
                                break;
                            case 'personnelCount':
                                {
                                    const radiogram = getActivityById(
                                        draftState,
                                        simulatedRegion.id,
                                        event.generateReportActivityId,
                                        'generateReportActivity'
                                    )
                                        .radiogram as WritableDraft<PersonnelCountRadiogram>;
                                    const personnel = Object.values(
                                        draftState.personnel
                                    ).filter((person) =>
                                        isInSpecificSimulatedRegion(
                                            person,
                                            simulatedRegion.id
                                        )
                                    );
                                    const groupedPersonnel = groupBy(
                                        personnel,
                                        (person) => person.templateId
                                    );
                                    radiogram.personnelCount =
                                        StrictObject.fromEntries(
                                            Object.entries(
                                                groupedPersonnel
                                            ).map(([key, value]) => [
                                                key,
                                                value.length,
                                            ])
                                        ) as ResourceDescription;

                                    radiogram.informationAvailable = true;
                                }
                                break;
                            case 'transferConnections': {
                                const radiogram = getActivityById(
                                    draftState,
                                    simulatedRegion.id,
                                    event.generateReportActivityId,
                                    'generateReportActivity'
                                )
                                    .radiogram as WritableDraft<TransferConnectionsRadiogram>;

                                const ownTransferPoint = getElementByPredicate(
                                    draftState,
                                    'transferPoint',
                                    (transferPoint) =>
                                        isInSpecificSimulatedRegion(
                                            transferPoint,
                                            simulatedRegion.id
                                        )
                                );

                                const connectedSimulatedRegions =
                                    Object.fromEntries(
                                        StrictObject.entries(
                                            ownTransferPoint.reachableTransferPoints
                                        )
                                            .map(
                                                ([transferPointId, value]) =>
                                                    [
                                                        getElement(
                                                            draftState,
                                                            'transferPoint',
                                                            transferPointId
                                                        ),
                                                        value.duration,
                                                    ] as const
                                            )
                                            .filter(([transferPoint]) =>
                                                isInSimulatedRegion(
                                                    transferPoint
                                                )
                                            )
                                            .map(
                                                ([transferPoint, duration]) => [
                                                    currentSimulatedRegionIdOf(
                                                        transferPoint
                                                    ),
                                                    duration,
                                                ]
                                            )
                                    );

                                radiogram.connectedRegions =
                                    connectedSimulatedRegions;
                                radiogram.informationAvailable = true;

                                break;
                            }
                            case 'vehicleCount': {
                                const radiogram = getActivityById(
                                    draftState,
                                    simulatedRegion.id,
                                    event.generateReportActivityId,
                                    'generateReportActivity'
                                )
                                    .radiogram as WritableDraft<VehicleCountRadiogram>;
                                const vehicles = Object.values(
                                    draftState.vehicles
                                ).filter((vehicle) =>
                                    isInSpecificSimulatedRegion(
                                        vehicle,
                                        simulatedRegion.id
                                    )
                                );
                                const groupedVehicles = groupBy(
                                    vehicles,
                                    (vehicle) => vehicle.vehicleType
                                );
                                radiogram.vehicleCount = Object.fromEntries(
                                    StrictObject.entries(groupedVehicles).map(
                                        ([vehicleType, vehicleGroup]) => [
                                            vehicleType,
                                            vehicleGroup.length,
                                        ]
                                    )
                                );

                                radiogram.informationAvailable = true;
                                break;
                            }
                            case 'vehicleOccupations': {
                                const radiogram = getActivityById(
                                    draftState,
                                    simulatedRegion.id,
                                    event.generateReportActivityId,
                                    'generateReportActivity'
                                )
                                    .radiogram as WritableDraft<VehicleOccupationsRadiogram>;
                                const vehicles = Object.values(
                                    draftState.vehicles
                                ).filter((vehicle) =>
                                    isInSpecificSimulatedRegion(
                                        vehicle,
                                        simulatedRegion.id
                                    )
                                );
                                const groupedVehicles = groupBy(
                                    vehicles,
                                    (vehicle) => vehicle.occupation.type
                                );
                                radiogram.occupations = Object.fromEntries(
                                    StrictObject.entries(groupedVehicles).map(
                                        ([occupationType, vehicleGroup]) => [
                                            occupationType,
                                            vehicleGroup.length,
                                        ]
                                    )
                                );

                                radiogram.informationAvailable = true;
                                break;
                            }
                            default:
                            // Ignore event
                        }
                    }
                    break;
                default:
                // Ignore event
            }
        },
    };

function selectNewLeader(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<AssignLeaderBehaviorState>,
    changeLeaderIfNoLeaderSelected: boolean
) {
    const personnel = Object.values(draftState.personnel).filter(
        (pers) =>
            isInSpecificSimulatedRegion(pers, simulatedRegion.id) &&
            pers.personnelType !== 'notarzt'
    );

    if (personnel.length === 0) {
        if (changeLeaderIfNoLeaderSelected) {
            changeLeader(draftState, simulatedRegion, behaviorState, undefined);
        }
        return;
    }

    personnel.sort(
        (a, b) =>
            (personnelPriorities[b.personnelType] ?? -1) -
            (personnelPriorities[a.personnelType] ?? -1)
    );
    changeLeader(draftState, simulatedRegion, behaviorState, personnel[0]?.id);
}

function changeLeader(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegion: WritableDraft<SimulatedRegion>,
    behaviorState: WritableDraft<AssignLeaderBehaviorState>,
    newLeaderId: UUID | undefined
) {
    addActivity(
        simulatedRegion,
        newDelayEventActivityState(
            nextUUID(draftState),
            newLeaderChangedEvent(
                behaviorState.leaderId ?? null,
                newLeaderId ?? null
            ),
            draftState.currentTime
        )
    );
    behaviorState.leaderId = newLeaderId;
}

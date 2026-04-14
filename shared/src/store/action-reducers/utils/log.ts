import type { WritableDraft } from 'immer';
import { newLogEntry } from '../../../models/log-entry.js';
import type { Tag } from '../../../models/tag.js';
import {
    type PatientStatus,
    statusNames,
} from '../../../models/utils/patient-status.js';
import {
    createAlarmGroupTag,
    createBehaviorTag,
    createHospitalTag,
    createPatientTag,
    createSimulatedRegionTagWithName,
    createPatientStatusTag,
    createRadiogramTypeTag,
    createSimulatedRegionTag,
    createTagsForSinglePatient,
    createTransferPointTag,
    createTreatmentProgressTag,
    createVehicleTag,
    createVehicleTypeTag,
    createPersonnelTypeTag,
} from '../../../models/utils/tag-helpers.js';
import type { TreatmentProgress } from '../../../simulation/utils/treatment.js';
import { treatmentProgressToGermanNameDictionary } from '../../../simulation/utils/treatment.js';
import type { ExerciseState } from '../../../state.js';
import { getPatientVisibleStatus } from '../../../models/patient.js';
import {
    currentSimulatedRegionIdOf,
    currentSimulatedRegionOf,
    isInSimulatedRegion,
} from '../../../models/utils/position/position-helpers.js';
import type { WithPosition } from '../../../models/utils/position/with-position.js';
import type { TransferPoint } from '../../../models/transfer-point.js';
import type { Hospital } from '../../../models/hospital.js';
import { behaviorTypeToGermanNameDictionary } from '../../../simulation/behaviors/utils.js';
import type { UUID } from '../../../utils/uuid.js';
import type { Personnel } from '../../../models/personnel.js';
import type { Vehicle } from '../../../models/vehicle.js';
import { formatDuration } from '../../../utils/format-duration.js';
import type { ExerciseRadiogram } from '../../../models/radiogram/exercise-radiogram.js';
import { StrictObject } from '../../../utils/strict-object.js';
import {
    getElement,
    getExerciseBehaviorById,
    getExerciseRadiogramById,
} from './get-element.js';

export function log(
    state: WritableDraft<ExerciseState>,
    tags: Tag[],
    description: string
) {
    if (!logActive(state)) return;

    const logEntry = newLogEntry(description, tags, state.currentTime);

    if (state.logEntries) {
        state.logEntries.push(logEntry);
    }
    if (state.type === 'parallel') {
        state.lastLogEntry = logEntry;
    }
}

export function logAlarmGroup(
    state: WritableDraft<ExerciseState>,
    additionalTags: Tag[],
    description: string,
    alarmGroupId: UUID
) {
    if (!logActive(state)) return;

    log(
        state,
        [...additionalTags, createAlarmGroupTag(state, alarmGroupId)],
        description
    );
}

export function logAlarmGroupSent(
    state: WritableDraft<ExerciseState>,
    alarmGroupId: UUID
) {
    if (!logActive(state)) return;

    const alarmGroup = getElement(state, 'alarmGroup', alarmGroupId);

    logAlarmGroup(
        state,
        [],
        `Die Alarmgruppe ${alarmGroup.name} wurde alarmiert`,
        alarmGroupId
    );
}

export function logPatient(
    state: WritableDraft<ExerciseState>,
    additionalTags: Tag[],
    description: string,
    patientId: UUID
) {
    if (!logActive(state)) return;

    log(
        state,
        [...additionalTags, ...createTagsForSinglePatient(state, patientId)],
        description
    );
}

export function logPatientAdded(
    state: WritableDraft<ExerciseState>,
    patientId: UUID
) {
    if (!logActive(state)) return;

    logPatient(state, [], `Ein Patient wurde hinzugefügt.`, patientId);
}

export function logPatientRemoved(
    state: WritableDraft<ExerciseState>,
    patientId: UUID
) {
    if (!logActive(state)) return;

    logPatient(state, [], `Ein Patient wurde entfernt.`, patientId);
}

export function logPatientVisibleStatusChanged(
    state: WritableDraft<ExerciseState>,
    patientId: UUID
) {
    if (!logActive(state)) return;

    const patient = getElement(state, 'patient', patientId);

    const visibleStatus = getPatientVisibleStatus(
        patient,
        state.configuration.pretriageEnabled,
        state.configuration.bluePatientsEnabled
    );

    logPatient(
        state,
        [],
        `Ein Patient wurde als ${statusNames[visibleStatus]} gesichtet.`,
        patientId
    );
}

export function logSimulatedRegion(
    state: WritableDraft<ExerciseState>,
    additionalTags: Tag[],
    description: string,
    simulatedRegionId: UUID
) {
    if (!logActive(state)) return;

    log(
        state,
        [...additionalTags, createSimulatedRegionTag(state, simulatedRegionId)],
        description
    );
}

export function logSimulatedRegionNameChange(
    state: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    newName: string
) {
    if (!logActive(state)) return;

    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        simulatedRegionId
    );

    logSimulatedRegion(
        state,
        [createSimulatedRegionTagWithName(state, simulatedRegionId, newName)],
        `Der ehemalige Bereich ${simulatedRegion.name} heißt nun ${newName}`,
        simulatedRegionId
    );
}

export function logSimulatedRegionAddElement(
    state: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    elementId: string,
    elementType: 'material' | 'patient' | 'personnel' | 'vehicle'
) {
    if (!logActive(state)) return;

    switch (elementType) {
        case 'material':
            {
                logSimulatedRegion(
                    state,
                    [],
                    `Dem Bereich wurde Material hinzugefügt.`,
                    simulatedRegionId
                );
            }
            break;
        case 'patient':
            {
                const element = getElement(state, elementType, elementId);

                logSimulatedRegion(
                    state,
                    [
                        createPatientTag(state, element.id),
                        createPatientStatusTag(state, element.pretriageStatus),
                    ],
                    `Dem Bereich wurde ein Patient hinzugefügt.`,
                    simulatedRegionId
                );
            }
            break;
        case 'personnel':
            {
                const element = getElement(state, elementType, elementId);

                logSimulatedRegion(
                    state,
                    [createPersonnelTypeTag(state, element)],
                    `Dem Bereich wurde ein ${element.typeName} hinzugefügt`,
                    simulatedRegionId
                );
            }
            break;
        case 'vehicle':
            {
                const element = getElement(state, elementType, elementId);

                logSimulatedRegion(
                    state,
                    [
                        createVehicleTag(state, elementId),
                        createVehicleTypeTag(state, element.vehicleType),
                    ],
                    `Dem Bereich wurde ein ${element.vehicleType} hinzugefügt`,
                    simulatedRegionId
                );
            }
            break;
    }
}

export function logBehavior(
    state: WritableDraft<ExerciseState>,
    additionalTags: Tag[],
    description: string,
    simulatedRegionId: UUID,
    behaviorId: UUID
) {
    if (!logActive(state)) return;

    logSimulatedRegion(
        state,
        [
            ...additionalTags,
            createBehaviorTag(state, simulatedRegionId, behaviorId),
        ],
        description,
        simulatedRegionId
    );
}

export function logBehaviorAdded(
    state: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorId: UUID
) {
    if (!logActive(state)) return;

    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        simulatedRegionId
    );

    const behavior = getExerciseBehaviorById(
        state,
        simulatedRegionId,
        behaviorId
    );

    logBehavior(
        state,
        [],
        `Das Verhalten ${
            behaviorTypeToGermanNameDictionary[behavior.type]
        } wurde dem Bereich ${simulatedRegion.name} hinzugefügt.`,
        simulatedRegionId,
        behaviorId
    );
}

export function logBehaviorRemoved(
    state: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorId: UUID
) {
    if (!logActive(state)) return;

    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        simulatedRegionId
    );

    const behavior = getExerciseBehaviorById(
        state,
        simulatedRegionId,
        behaviorId
    );

    logBehavior(
        state,
        [],
        `Das Verhalten ${
            behaviorTypeToGermanNameDictionary[behavior.type]
        } wurde aus dem Bereich ${simulatedRegion.name} entfernt.`,
        simulatedRegionId,
        behaviorId
    );
}

export function logTransferPoint(
    state: WritableDraft<ExerciseState>,
    additionalTags: Tag[],
    description: string,
    transferPointId: UUID
) {
    if (!logActive(state)) return;

    const transferPoint = getElement(state, 'transferPoint', transferPointId);

    log(
        state,
        [
            ...additionalTags,
            isInSimulatedRegion(transferPoint)
                ? createSimulatedRegionTag(
                      state,
                      currentSimulatedRegionOf(state, transferPoint).id
                  )
                : createTransferPointTag(state, transferPointId),
        ],
        description
    );
}

export function logTransferPointConnection(
    state: WritableDraft<ExerciseState>,
    transferSourceId: UUID,
    transferTargetId: UUID,
    transferTargetType: 'hospital' | 'transferPoint'
) {
    if (!logActive(state)) return;

    const source = getElement(state, 'transferPoint', transferSourceId);
    const target = getElement(state, transferTargetType, transferTargetId);

    logTransferPoint(
        state,
        [
            transferTargetType === 'transferPoint'
                ? isInSimulatedRegion(target as WithPosition)
                    ? createSimulatedRegionTag(
                          state,
                          currentSimulatedRegionOf(
                              state,
                              target as WithPosition
                          ).id
                      )
                    : createTransferPointTag(state, transferTargetId)
                : createHospitalTag(state, transferTargetId),
        ],
        `Es wurde ein Transfer von ${source.externalName} nach ${
            transferTargetType === 'transferPoint'
                ? (target as TransferPoint).externalName
                : (target as Hospital).name
        } eingerichtet.`,
        transferSourceId
    );
}

export function logTransferPointConnectionRemoved(
    state: WritableDraft<ExerciseState>,
    transferSourceId: UUID,
    transferTargetId: UUID,
    transferTargetType: 'hospital' | 'transferPoint'
) {
    if (!logActive(state)) return;

    const source = getElement(state, 'transferPoint', transferSourceId);
    const target = getElement(state, transferTargetType, transferTargetId);

    logTransferPoint(
        state,
        [
            transferTargetType === 'transferPoint'
                ? isInSimulatedRegion(target as WithPosition)
                    ? createSimulatedRegionTag(
                          state,
                          currentSimulatedRegionOf(
                              state,
                              target as WithPosition
                          ).id
                      )
                    : createTransferPointTag(state, transferTargetId)
                : createHospitalTag(state, transferTargetId),
        ],
        `Der Transfer von ${source.externalName} nach ${
            transferTargetType === 'transferPoint'
                ? (target as TransferPoint).externalName
                : (target as Hospital).name
        } wurde entfernt.`,
        transferSourceId
    );
}

export function logElementAddedToTransfer(
    state: WritableDraft<ExerciseState>,
    transferSourceId: UUID,
    transferSourceType: 'alarmGroup' | 'transferPoint',
    elementId: UUID,
    elementType: 'personnel' | 'vehicle',
    transferTargetId: UUID,
    transferTargetType: 'hospital' | 'transferPoint',
    duration: number
) {
    if (!logActive(state)) return;

    const target = getElement(state, transferTargetType, transferTargetId);
    const element = getElement(state, elementType, elementId);

    if (transferSourceType === 'alarmGroup') {
        const alarmGroup = getElement(state, 'alarmGroup', transferSourceId);

        logAlarmGroup(
            state,
            [
                ...[
                    transferTargetType === 'transferPoint'
                        ? isInSimulatedRegion(target as WithPosition)
                            ? createSimulatedRegionTag(
                                  state,
                                  currentSimulatedRegionOf(
                                      state,
                                      target as WithPosition
                                  ).id
                              )
                            : createTransferPointTag(state, transferTargetId)
                        : createHospitalTag(state, transferTargetId),
                    elementType === 'personnel'
                        ? createPersonnelTypeTag(state, element as Personnel)
                        : createVehicleTypeTag(
                              state,
                              (element as Vehicle).vehicleType
                          ),
                ],
                ...(elementType === 'vehicle'
                    ? [createVehicleTag(state, elementId)]
                    : []),
            ],
            `Ein ${
                elementType === 'personnel'
                    ? (element as Personnel).personnelType
                    : (element as Vehicle).vehicleType
            } wird in ${formatDuration(duration)} von ${alarmGroup.name} nach ${
                transferTargetType === 'transferPoint'
                    ? (target as TransferPoint).externalName
                    : (target as Hospital).name
            } transferiert.`,
            transferSourceId
        );
    } else {
        const source = getElement(state, 'transferPoint', transferSourceId);

        logTransferPoint(
            state,
            [
                ...[
                    transferTargetType === 'transferPoint'
                        ? isInSimulatedRegion(target as WithPosition)
                            ? createSimulatedRegionTag(
                                  state,
                                  currentSimulatedRegionOf(
                                      state,
                                      target as WithPosition
                                  ).id
                              )
                            : createTransferPointTag(state, transferTargetId)
                        : createHospitalTag(state, transferTargetId),
                    elementType === 'personnel'
                        ? createPersonnelTypeTag(state, element as Personnel)
                        : createVehicleTypeTag(
                              state,
                              (element as Vehicle).vehicleType
                          ),
                ],
                ...(elementType === 'vehicle'
                    ? [createVehicleTag(state, elementId)]
                    : []),
            ],
            `Ein ${
                elementType === 'personnel'
                    ? (element as Personnel).personnelType
                    : (element as Vehicle).name
            } wird in ${formatDuration(duration)} von ${
                source.externalName
            } nach ${
                transferTargetType === 'transferPoint'
                    ? (target as TransferPoint).externalName
                    : (target as Hospital).name
            } transferiert.`,
            transferSourceId
        );
    }
}

export function logTransferEdited(
    state: WritableDraft<ExerciseState>,
    elementId: UUID,
    elementType: 'personnel' | 'vehicle',
    oldTransferTargetId: UUID,
    newTransferTargetId: UUID,
    oldDuration: number,
    newDuration: number
) {
    if (!logActive(state)) return;

    const oldTarget = getElement(state, 'transferPoint', oldTransferTargetId);
    const newTarget = getElement(state, 'transferPoint', newTransferTargetId);
    const element = getElement(state, elementType, elementId);

    logTransferPoint(
        state,
        [
            elementType === 'personnel'
                ? createPersonnelTypeTag(state, element as Personnel)
                : createVehicleTypeTag(state, (element as Vehicle).vehicleType),
            ...(newTransferTargetId === oldTransferTargetId
                ? []
                : [createTransferPointTag(state, oldTransferTargetId)]),
            ...(elementType === 'vehicle'
                ? [createVehicleTag(state, elementId)]
                : []),
        ],
        `Der Transfer von ${
            elementType === 'personnel'
                ? (element as Personnel).personnelType
                : (element as Vehicle).name
        } nach ${oldTarget.externalName} in ${formatDuration(
            oldDuration
        )} wurde geändert, und geht jetzt nach ${
            newTarget.externalName
        } in ${formatDuration(newDuration)}.`,
        newTransferTargetId
    );
}

export function logTransferFinished(
    state: WritableDraft<ExerciseState>,
    elementId: UUID,
    elementType: 'personnel' | 'vehicle',
    transferTargetId: UUID
) {
    if (!logActive(state)) return;

    const target = getElement(state, 'transferPoint', transferTargetId);
    const element = getElement(state, elementType, elementId);

    logTransferPoint(
        state,
        [
            elementType === 'personnel'
                ? createPersonnelTypeTag(state, element as Personnel)
                : createVehicleTypeTag(state, (element as Vehicle).vehicleType),
            ...(elementType === 'vehicle'
                ? [createVehicleTag(state, elementId)]
                : []),
        ],
        `Der Transfer von ${
            elementType === 'personnel'
                ? (element as Personnel).personnelType
                : (element as Vehicle).name
        } nach ${target.externalName} wurde abgeschlossen.`,
        transferTargetId
    );
}

export function logTransferPause(
    state: WritableDraft<ExerciseState>,
    elementId: UUID,
    elementType: 'personnel' | 'vehicle',
    transferTargetId: UUID,
    paused: boolean
) {
    if (!logActive(state)) return;

    const target = getElement(state, 'transferPoint', transferTargetId);
    const element = getElement(state, elementType, elementId);

    logTransferPoint(
        state,
        [
            elementType === 'personnel'
                ? createPersonnelTypeTag(state, element as Personnel)
                : createVehicleTypeTag(state, (element as Vehicle).vehicleType),
            ...(elementType === 'vehicle'
                ? [createVehicleTag(state, elementId)]
                : []),
        ],
        `Der Transfer von ${
            elementType === 'personnel'
                ? (element as Personnel).personnelType
                : (element as Vehicle).name
        } nach ${target.externalName} wurde ${
            paused ? 'pausiert' : 'fortgesetzt'
        }.`,
        transferTargetId
    );
}

export function logRadiogram(
    state: WritableDraft<ExerciseState>,
    additionalTags: Tag[],
    description: string,
    radiogramId: UUID
) {
    if (!logActive(state)) return;

    const radiogram = getExerciseRadiogramById(state, radiogramId);

    log(
        state,
        [
            ...additionalTags,
            ...createTagsForRadiogramType(state, radiogram),
            createRadiogramTypeTag(state, radiogramId),
            createSimulatedRegionTag(state, radiogram.simulatedRegionId),
        ],
        `${description} ${createRadiogramDescription(state, radiogram)}`
    );
}
export function logTreatmentStatusChangedInSimulatedRegion(
    state: WritableDraft<ExerciseState>,
    treatmentProgress: TreatmentProgress,
    simulatedRegionId: UUID,
    additionalTags: Tag[] = []
) {
    if (!logActive(state)) return;

    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        simulatedRegionId
    );

    log(
        state,
        [
            ...additionalTags,
            createTreatmentProgressTag(state, treatmentProgress),
            createSimulatedRegionTag(state, simulatedRegionId),
        ],
        `Der Behandlungszustand im simulierten Bereich ${simulatedRegion.name} ist zu ${treatmentProgressToGermanNameDictionary[treatmentProgress]} gewechselt.`
    );
}

export function logLastPatientTransported(
    state: WritableDraft<ExerciseState>,
    patientStatus: PatientStatus,
    simulatedRegionId: UUID,
    description: string,
    additionalTags: Tag[] = []
) {
    if (!logActive(state)) return;

    log(
        state,
        [
            ...additionalTags,
            createPatientStatusTag(state, patientStatus),
            createSimulatedRegionTag(state, simulatedRegionId),
        ],
        description
    );
}

export function logLastPatientTransportedInSimulatedRegion(
    state: WritableDraft<ExerciseState>,
    patientStatus: PatientStatus,
    simulatedRegionId: UUID
) {
    if (!logActive(state)) return;

    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        simulatedRegionId
    );

    logLastPatientTransported(
        state,
        patientStatus,
        simulatedRegionId,
        `Der letzte Patient der Kategorie ${statusNames[patientStatus]} im simulierten Bereich ${simulatedRegion.name} ist abtransportiert worden`
    );
}

export function logLastPatientTransportedInMultipleSimulatedRegions(
    state: WritableDraft<ExerciseState>,
    patientStatus: PatientStatus,
    managingSimulatedRegionId: UUID
) {
    if (!logActive(state)) return;

    const simulatedRegion = getElement(
        state,
        'simulatedRegion',
        managingSimulatedRegionId
    );

    logLastPatientTransported(
        state,
        patientStatus,
        managingSimulatedRegionId,
        `Der letzte Patient der Kategorie ${statusNames[patientStatus]} in allen Bereichen, die von der TO in ${simulatedRegion.name} verwaltet werden, ist abtransportiert worden`
    );
}

export function logVehicle(
    state: WritableDraft<ExerciseState>,
    additionalTags: Tag[],
    description: string,
    vehicleId: UUID
) {
    if (!logActive(state)) return;

    const vehicle = getElement(state, 'vehicle', vehicleId);

    log(
        state,
        [
            ...additionalTags,
            ...createPatientTags(state, Object.keys(vehicle.patientIds)),
            createVehicleTag(state, vehicle.id),
            createVehicleTypeTag(state, vehicle.vehicleType),
            ...(isInSimulatedRegion(vehicle)
                ? [
                      createSimulatedRegionTag(
                          state,
                          currentSimulatedRegionIdOf(vehicle)
                      ),
                  ]
                : []),
        ],
        description
    );
}

export function logVehicleAdded(
    state: WritableDraft<ExerciseState>,
    vehicleId: UUID
) {
    if (!logActive(state)) return;

    logVehicle(state, [], `Ein Fahrzeug wurde hinzugefügt.`, vehicleId);
}

export function logVehicleRemoved(
    state: WritableDraft<ExerciseState>,
    vehicleId: UUID
) {
    if (!logActive(state)) return;

    logVehicle(state, [], `Ein Fahrzeug wurde entfernt.`, vehicleId);
}

function createPatientTags(
    state: WritableDraft<ExerciseState>,
    patientIds: UUID[]
): Tag[] {
    return patientIds.flatMap((patientId) =>
        createTagsForSinglePatient(state, patientId)
    );
}

function createTagsForRadiogramType(
    state: WritableDraft<ExerciseState>,
    radiogram: ExerciseRadiogram
): Tag[] {
    switch (radiogram.type) {
        case 'missingTransferConnectionRadiogram':
            return [
                createTransferPointTag(state, radiogram.targetTransferPointId),
            ];
        case 'treatmentStatusRadiogram':
            return [
                createTreatmentProgressTag(state, radiogram.treatmentStatus),
            ];
        default:
            return [];
    }
}

function createRadiogramDescription(
    state: WritableDraft<ExerciseState>,
    radiogram: ExerciseRadiogram
): string {
    if (!radiogram.informationAvailable) return '';

    switch (radiogram.type) {
        case 'missingTransferConnectionRadiogram': {
            const transferPoint = getElement(
                state,
                'transferPoint',
                radiogram.targetTransferPointId
            );
            return `Eine Transferverbindung zu ${transferPoint.externalName} existierte nicht.`;
        }
        case 'treatmentStatusRadiogram': {
            return `Der Behandlungsstatus war ${
                treatmentProgressToGermanNameDictionary[
                    radiogram.treatmentStatus
                ]
            }.`;
        }
        case 'materialCountRadiogram': {
            return `Es gab Materialien für die folgenden Patientenkategorien: ${generateCountString(
                {
                    red: radiogram.materialForPatients.red,
                    yellow: radiogram.materialForPatients.yellow,
                    green: radiogram.materialForPatients.green,
                },
                (status) => statusNames[status]
            )}.`;
        }
        case 'patientCountRadiogram': {
            return `Es wurden die folgenden Patientenzahlen in der Region gezählt: ${generateCountString(
                radiogram.patientCount,
                (status) => statusNames[status]
            )}.`;
        }
        case 'personnelCountRadiogram': {
            return `In dieser Region gab es die folgenden Einsatzkräfte: ${generateCountString(
                radiogram.personnelCount,
                (id) => state.personnelTemplates[id]?.name ?? ''
            )}.`;
        }
        case 'resourceRequestRadiogram': {
            return `Es wurden die folgenden Resourcen angefragt: ${generateCountString(
                radiogram.requiredResource.vehicleCounts,
                (vehicleType) => vehicleType
            )}.`;
        }
        case 'transferCategoryCompletedRadiogram': {
            return `Der Transport der Kategorie ${
                statusNames[radiogram.completedCategory]
            } wurde abgeshlossen.`;
        }
        case 'transferCountsRadiogram': {
            return `Es wurden die folgenden Patientenzahlen ${
                radiogram.scope === 'singleRegion'
                    ? 'in dieser Region'
                    : 'in den Regionen'
            } abtransportiert: ${generateCountString(
                radiogram.transferredPatientsCounts,
                (status) => statusNames[status]
            )}. Nun verbleiben noch die folgenden Patienten: ${generateCountString(
                radiogram.remainingPatientsCounts,
                (status) => statusNames[status]
            )}`;
        }
        case 'vehicleCountRadiogram': {
            return `In dieser Region gibt es die folgenden Fahrzeuge: ${generateCountString(
                radiogram.vehicleCount,
                (vehicleType) => vehicleType
            )}.`;
        }
        default:
            return '';
    }
}

function generateCountString<K extends string>(
    countsObject: { readonly [key in K]: number },
    nameOf: (key: K) => string
): string {
    return StrictObject.keys(countsObject)
        .map((status) => `${countsObject[status]} ${nameOf(status)}`)
        .join(', ');
}

export function logActive(state: WritableDraft<ExerciseState>): boolean {
    return !!state.logEntries || state.type === 'parallel';
}

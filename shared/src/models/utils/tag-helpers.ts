/**
 * This file should contain helper function to build tags for a specific category.
 * Their input should always be the current state and the specifier,
 * and they should figure out the color and name for the tag by themselves.
 */

import type { WritableDraft } from 'immer';
import { behaviorTypeToGermanNameDictionary } from '../../simulation/behaviors/utils.js';
import type { TreatmentProgress } from '../../simulation/utils/treatment.js';
import { treatmentProgressToGermanNameDictionary } from '../../simulation/utils/treatment.js';
import type { ExerciseState } from '../../state.js';
import {
    getElement,
    getExerciseBehaviorById,
    getExerciseRadiogramById,
} from '../../store/action-reducers/utils/get-element.js';
import { getPatientVisibleStatus } from '../patient.js';
import { radiogramTypeToGermanDictionary } from '../radiogram/exercise-radiogram.js';
import type { ExerciseRadiogramStatus } from '../radiogram/status/exercise-radiogram-status.js';
import { radiogramStatusTypeToGermanDictionary } from '../radiogram/status/exercise-radiogram-status.js';
import type { Tag } from '../tag.js';
import { newTag } from '../tag.js';
import type { Personnel } from '../personnel.js';
import type { PersonnelTemplate } from '../personnel-template.js';
import type { UUID } from '../../utils/uuid.js';
import {
    type ExerciseOccupation,
    occupationToGermanDictionary,
} from './occupations/exercise-occupation.js';
import { statusNames } from './patient-status.js';
import type { PatientStatus } from './patient-status.js';
import {
    currentSimulatedRegionIdOf,
    isInSimulatedRegion,
} from './position/position-helpers.js';

export function createPatientStatusTag(
    _draftState: WritableDraft<ExerciseState>,
    patientStatus: PatientStatus
): Tag {
    return newTag(
        'Sichtungskategorie',
        patientStatus,
        patientStatus === 'yellow' || patientStatus === 'white'
            ? 'black'
            : 'white',
        statusNames[patientStatus],
        patientStatus
    );
}

export function createPatientTag(
    draftState: WritableDraft<ExerciseState>,
    patientId: UUID
): Tag {
    const patient = getElement(draftState, 'patient', patientId);
    return newTag('Patient', 'cyan', 'black', patient.identifier, patientId);
}

export function createTagsForSinglePatient(
    draftState: WritableDraft<ExerciseState>,
    patientId: UUID
): Tag[] {
    const patient = getElement(draftState, 'patient', patientId);
    return [
        createPatientStatusTag(
            draftState,
            getPatientVisibleStatus(
                patient,
                draftState.configuration.pretriageEnabled,
                draftState.configuration.bluePatientsEnabled
            )
        ),
        createPatientTag(draftState, patientId),
        ...(isInSimulatedRegion(patient)
            ? [
                  createSimulatedRegionTag(
                      draftState,
                      currentSimulatedRegionIdOf(patient)
                  ),
              ]
            : []),
    ];
}

export function createRadiogramTypeTag(
    draftState: WritableDraft<ExerciseState>,
    radiogramId: UUID
): Tag {
    const radiogram = getExerciseRadiogramById(draftState, radiogramId);

    return newTag(
        'Funkspruchtyp',
        'green',
        'white',
        radiogramTypeToGermanDictionary[radiogram.type],
        radiogram.type
    );
}

export function createRadiogramActionTag(
    _draftState: WritableDraft<ExerciseState>,
    radiogramStatus:
        | ExerciseRadiogramStatus['type']
        | 'resourcesPromised'
        | 'resourcesRejected'
): Tag {
    let name;
    if (radiogramStatus === 'resourcesPromised') {
        name = 'Ressourcen versprochen';
    } else if (radiogramStatus === 'resourcesRejected') {
        name = 'Ressourcen abgelehnt';
    } else {
        name = radiogramStatusTypeToGermanDictionary[radiogramStatus];
    }
    return newTag(
        'Funkspruchaktion',
        'lightgreen',
        'black',
        name,
        radiogramStatus
    );
}

export function createSimulatedRegionTag(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID
): Tag {
    const simulatedRegion = getElement(
        draftState,
        'simulatedRegion',
        simulatedRegionId
    );
    return createSimulatedRegionTagWithName(
        draftState,
        simulatedRegionId,
        simulatedRegion.name
    );
}

export function createSimulatedRegionTagWithName(
    _draftState: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    name: string
): Tag {
    return newTag(
        'Simulierter Bereich',
        'lightblue',
        'black',
        name,
        simulatedRegionId
    );
}

export function createTransferPointTag(
    draftState: WritableDraft<ExerciseState>,
    transferPointId: UUID
): Tag {
    const transferPoint = getElement(
        draftState,
        'transferPoint',
        transferPointId
    );
    return newTag(
        'Transferpunkt',
        'lightgreen',
        'black',
        transferPoint.externalName,
        transferPoint.id
    );
}

export function createTreatmentProgressTag(
    draftState: WritableDraft<ExerciseState>,
    treatmentProgress: TreatmentProgress
): Tag {
    return newTag(
        'Behandlungsfortschritt',
        'orange',
        'white',
        treatmentProgressToGermanNameDictionary[treatmentProgress],
        treatmentProgress
    );
}

export function createAlarmGroupTag(
    draftState: WritableDraft<ExerciseState>,
    alarmGroupId: UUID
): Tag {
    const alarmGroup = getElement(draftState, 'alarmGroup', alarmGroupId);
    return newTag(
        'Alarmgruppe',
        'lightgreen',
        'black',
        alarmGroup.name,
        alarmGroup.id
    );
}

export function createVehicleTag(
    draftState: WritableDraft<ExerciseState>,
    vehicleId: UUID
): Tag {
    const vehicle = getElement(draftState, 'vehicle', vehicleId);
    return newTag('Fahrzeug', 'grey', 'white', vehicle.name, vehicleId);
}

export function createVehicleTypeTag(
    _draftState: WritableDraft<ExerciseState>,
    vehicleType: UUID
): Tag {
    return newTag('Fahrzeugtyp', 'grey', 'white', vehicleType, vehicleType);
}

export function createOccupationTag(
    _draftState: WritableDraft<ExerciseState>,
    occupation: ExerciseOccupation
): Tag {
    return newTag(
        'Tätigkeit',
        'black',
        'white',
        occupationToGermanDictionary[occupation.type],
        occupation.type
    );
}

export function createVehicleActionTag(
    _draftState: WritableDraft<ExerciseState>,
    vehicleAction: 'arrived' | 'departed' | 'loaded' | 'unloaded'
): Tag {
    let vehicleActionName;
    switch (vehicleAction) {
        case 'arrived':
            vehicleActionName = 'Angekommen';
            break;
        case 'departed':
            vehicleActionName = 'Losgefahren';
            break;
        case 'loaded':
            vehicleActionName = 'Beladen';
            break;
        case 'unloaded':
            vehicleActionName = 'Entladen';
            break;
    }
    return newTag(
        'Fahrzeugaktion',
        'purple',
        'white',
        vehicleActionName,
        vehicleAction
    );
}

export function createHospitalTag(
    draftState: WritableDraft<ExerciseState>,
    hospitalId: UUID
): Tag {
    const hospital = getElement(draftState, 'hospital', hospitalId);
    return newTag(
        'Krankenhaus',
        'firebrick',
        'white',
        hospital.name,
        hospitalId
    );
}

export function createBehaviorTag(
    draftState: WritableDraft<ExerciseState>,
    simulatedRegionId: UUID,
    behaviorId: UUID
): Tag {
    const behavior = getExerciseBehaviorById(
        draftState,
        simulatedRegionId,
        behaviorId
    );
    return newTag(
        'Verhalten',
        'lightgreen',
        'black',
        behaviorTypeToGermanNameDictionary[behavior.type],
        behavior.id
    );
}
export function createPersonnelTypeTag(
    _draftState: WritableDraft<ExerciseState>,
    personnel: Personnel | PersonnelTemplate
): Tag {
    return newTag(
        'Personaltyp',
        'chocolate',
        'white',
        personnel.type === 'personnelTemplate'
            ? personnel.name
            : personnel.typeName,
        personnel.type === 'personnelTemplate'
            ? personnel.id
            : personnel.templateId
    );
}

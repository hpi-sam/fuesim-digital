import { PatientCategory } from '../../models/patient-category.js';
import {
    newFunctionParameters,
    newPatientHealthState,
} from '../../models/patient-health-state.js';
import { newPatientTemplate } from '../../models/patient-template.js';
import type { ImageProperties } from '../../models/utils/index.js';
import { healthPointsDefaults } from '../../models/utils/index.js';

const defaultPatientImage: ImageProperties = {
    url: '/assets/patient.svg',
    height: 80,
    aspectRatio: 1,
};

// returns the change needed to reach the targetHealth from startHealth in the time of phases
function calculateHealthChange(
    starthealth: number,
    targetHealth: number,
    phases: number
) {
    // TODO: Make this dependent on the actual tick intervals during an exercise - we can never know how many ticks will happen in one state
    return (targetHealth - starthealth) / (phases * 12 * 60);
}

const phaseTime = 12 * 60 * 1000;

const noChangesState = newPatientHealthState(
    newFunctionParameters(0, 0, 0, 0),
    []
);

const recoverToGreenState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.greenAverage,
            3
        ),
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.greenAverage,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.greenAverage,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.greenAverage,
            1
        )
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            minimumHealth: healthPointsDefaults.greenAverage,
        },
    ]
);

const yellowFor2PhasesState = newPatientHealthState(
    newFunctionParameters(0, 0, 0, 0),
    [
        {
            matchingHealthStateId: recoverToGreenState.id,
            earliestTime: 2 * phaseTime,
        },
    ]
);

const greenUntilPhase2State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.greenMax,
            healthPointsDefaults.yellowAverage,
            2
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: yellowFor2PhasesState.id,
            maximumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const waitForTransportState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.blackMax,
        },
    ]
);

const greenStartPhase5RADecisionState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            1
        ),
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.blackMax,
        },
        {
            matchingHealthStateId: waitForTransportState.id,
            earliestTime: 4 * phaseTime,
        },
    ]
);

const yellowToRedState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: greenStartPhase5RADecisionState.id,
            maximumHealth: healthPointsDefaults.redAverage,
        },
    ]
);

const greenUntilPhase4State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.greenMax,
            healthPointsDefaults.yellowAverage,
            4
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: yellowToRedState.id,
            maximumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const yellowToGreenState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.greenAverage,
            1
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            minimumHealth: healthPointsDefaults.greenAverage,
        },
    ]
);

const waitForYellowToGreenState = newPatientHealthState(
    newFunctionParameters(0, 0, 0, 0),
    [
        {
            matchingHealthStateId: yellowToGreenState.id,
            earliestTime: phaseTime,
        },
    ]
);

const greenUntilPhase7State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.greenMax,
            healthPointsDefaults.yellowAverage,
            7
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: waitForYellowToGreenState.id,
            maximumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const greenUntilPhase8State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.greenMax,
            healthPointsDefaults.yellowAverage,
            8
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: waitForYellowToGreenState.id,
            maximumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const greenStartPhase11RADecisionState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.blackMax,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.redMax,
            healthPointsDefaults.greenMax,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.redMax,
            healthPointsDefaults.greenMax,
            1
        ),
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            minimumHealth: healthPointsDefaults.greenAverage,
        },
    ]
);

const greenStartPhase10RADecisionState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.greenMax,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.greenMax,
            1
        ),
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            minimumHealth: healthPointsDefaults.greenMax,
        },
        {
            matchingHealthStateId: greenStartPhase11RADecisionState.id,
            earliestTime: phaseTime,
        },
    ]
);

const greenStartPhase9RSDecisionState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.greenAverage,
            1
        ) -
            calculateHealthChange(
                healthPointsDefaults.yellowAverage,
                healthPointsDefaults.redAverage,
                1
            ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        )
    ),
    [
        {
            matchingHealthStateId: greenStartPhase10RADecisionState.id,
            earliestTime: phaseTime,
        },
    ]
);

const greenUntilPhase9State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.greenMax,
            healthPointsDefaults.yellowAverage,
            9
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: greenStartPhase9RSDecisionState.id,
            maximumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const greenUntilPhase10State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.greenMax,
            healthPointsDefaults.yellowAverage,
            10
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const greenUntilPhase11State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.greenMax,
            healthPointsDefaults.yellowAverage,
            11
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const greenUntilPhase12State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.greenMax,
            healthPointsDefaults.yellowAverage,
            12
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const yellowUntilPhase5State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.yellowMax,
            5
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            minimumHealth: healthPointsDefaults.greenAverage,
        },
    ]
);

const recoverWithRSState = newPatientHealthState(
    newFunctionParameters(
        0,
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.yellowMax,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.yellowMax,
            1
        ),
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.yellowMax,
            1
        )
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            minimumHealth: healthPointsDefaults.greenAverage,
        },
    ]
);

const yellowUntilPhase4State = newPatientHealthState(
    newFunctionParameters(0, 0, 0, 0),
    [
        {
            matchingHealthStateId: recoverWithRSState.id,
            earliestTime: 4 * phaseTime,
        },
    ]
);

const yellowStartPhase4RSDecisionState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        )
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.redMax,
        },
    ]
);

const yellowUntilRedPhase4State = newPatientHealthState(
    newFunctionParameters(0, 0, 0, 0),
    [
        {
            matchingHealthStateId: yellowStartPhase4RSDecisionState.id,
            earliestTime: 4 * phaseTime,
        },
    ]
);

const yellowStartPhase9RADecisionState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.blackMax,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.blackMax,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.blackMax,
            1
        ),
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            minimumHealth: healthPointsDefaults.yellowAverage,
        },
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.blackMax,
        },
    ]
);

const yellowStartPhase8RADecisionState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        0
    ),
    [
        {
            matchingHealthStateId: yellowStartPhase9RADecisionState.id,
            earliestTime: phaseTime,
        },
    ]
);

const yellowStartPhase7RSDecisionState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        ),
        -calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            1
        )
    ),
    [
        {
            matchingHealthStateId: yellowStartPhase8RADecisionState.id,
            earliestTime: phaseTime,
        },
    ]
);

const yellowFor3PhasesState = newPatientHealthState(
    newFunctionParameters(0, 0, 0, 0),
    [
        {
            matchingHealthStateId: yellowStartPhase7RSDecisionState.id,
            earliestTime: 3 * phaseTime,
        },
    ]
);

const redUntilYellowFor2PhasesState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.yellowAverage,
            2
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: yellowFor3PhasesState.id,
            minimumHealth: healthPointsDefaults.yellowAverage,
        },
    ]
);

const yellowUntilPhase3State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            3
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: redUntilYellowFor2PhasesState.id,
            maximumHealth: healthPointsDefaults.redAverage,
        },
    ]
);

const redUntilBlack2PhasesState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.blackMax,
        },
    ]
);

const yellowUntilPrioRedPhase4State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.yellowAverage,
            healthPointsDefaults.redAverage,
            4
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: redUntilBlack2PhasesState.id,
            maximumHealth: healthPointsDefaults.redAverage,
        },
    ]
);

const redUntilBlackPhase2State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        -calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        -calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.blackMax,
        },
        {
            matchingHealthStateId: noChangesState.id,
            earliestTime: 3 * phaseTime,
        },
    ]
);

const redInstantTransportState = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            3
        ),
        0,
        0,
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.blackMax,
        },
    ]
);

const redIntoTransportFor2PhasesState = newPatientHealthState(
    newFunctionParameters(0, 0, 0, 0),
    [
        {
            matchingHealthStateId: redInstantTransportState.id,
            earliestTime: 2 * phaseTime,
        },
    ]
);

const redUntilPhase2State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        -calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        -calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.blackMax,
        },
        {
            matchingHealthStateId: redIntoTransportFor2PhasesState.id,
            earliestTime: 3 * phaseTime,
        },
    ]
);

const prioRedUntilPhase2State = newPatientHealthState(
    newFunctionParameters(
        calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        -calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        -calculateHealthChange(
            healthPointsDefaults.redAverage,
            healthPointsDefaults.blackMax,
            2
        ),
        0
    ),
    [
        {
            matchingHealthStateId: noChangesState.id,
            maximumHealth: healthPointsDefaults.blackMax,
        },
        {
            matchingHealthStateId: redInstantTransportState.id,
            earliestTime: 3 * phaseTime,
        },
    ]
);

export const defaultPatientCategories: readonly PatientCategory[] = [
    // XAXAXA Patients - Pregnant
    PatientCategory.create('XAXAXAP', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: 'blaue Augen, rothaarig, 1,69 m',
                age: 16,
            },
            {
                injuries:
                    'Prellmarke an der Stirn; blutende Wunde am linken Unterarm',
                bodyCheck:
                    'leichte Schmerzen beim Auftreten im rechten Sprunggelenk; Schwanger; sonst o.B.',
                breathing: 'unauffällig',
                awareness: 'leicht verwirrt',
                pulse: '79; gut tastbar',
                skin: 'unauffällig',
                pain: 'leichte',
                pupils: 'isocor',
                psyche: 'ängstlich',
                hearing: 'unauffällig',
                isWalkable: true,
            },
            { [noChangesState.id]: noChangesState },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            noChangesState.id
        ),
    ]),

    // XAXAXD Patients
    PatientCategory.create('XAXAXD', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: 'braune Haare, braune Augen, 1,72 m',
                age: 35,
            },
            {
                injuries: 'keine äußeren Verletzungen sichtbar',
                bodyCheck:
                    'Pat. ist teilnahmslos; keine Kooperation bei der Untersuchung',
                breathing: 'unauffällig',
                awareness: 'verwirrt',
                pulse: '82; Puls gut tastbar',
                skin: 'unauffällig',
                pain: 'keine',
                pupils: 'isocor',
                psyche: 'teilnahmslos',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [greenUntilPhase10State.id]: greenUntilPhase10State,
            },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            greenUntilPhase10State.id
        ),
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures: '1,89 m, Vollbart, blond, blauäugig',
                age: 25,
            },
            {
                injuries: 'keine äußeren Verletzungen zu sehen',
                bodyCheck:
                    'Pat. ist nahezu hysterisch; es besteht keine Kooperation bei Untersuchung',
                breathing: 'unauffällig',
                awareness: 'wach aber verwirrt',
                pulse: '94',
                skin: 'unauffällig',
                pain: 'keine',
                pupils: 'isocor',
                psyche: 'hysterisch',
                hearing: 'schwerhörig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [greenUntilPhase11State.id]: greenUntilPhase11State,
            },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            greenUntilPhase11State.id
        ),
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: '1,76m, hellblond, blaue Augen, Brille',
                age: 35,
            },
            {
                injuries: 'äußerlich keine Verletzungen',
                bodyCheck:
                    'keine Kooperation bei Untersuchung; Pat. hysterisch und verwirrt',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '95',
                skin: 'unauffällig',
                pain: 'keine',
                pupils: 'isocor',
                psyche: 'hysterisch',
                hearing: 'schwerhörig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [greenUntilPhase12State.id]: greenUntilPhase12State,
            },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            greenUntilPhase12State.id
        ),
    ]),

    // XAXDXA Patients
    PatientCategory.create('XAXDXA', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: 'braune Haare, braune Augen, 1,79 m, adipös',
                age: 50,
            },
            {
                injuries: 'leichte Augenverletzung rechts',
                bodyCheck:
                    'Pat. wirkt apathisch; keine Kooperation bei Untersuchung; Prellung Unterschenkel rechts; starke Schmerzen nur beim Auftreten',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '83; Puls flach',
                skin: 'unauffällig',
                pain: 'stark, aber nur beim Auftreten',
                pupils: 'isocor',
                psyche: 'teilnahmslos',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [greenUntilPhase7State.id]: greenUntilPhase7State,
                [waitForYellowToGreenState.id]: waitForYellowToGreenState,
                [yellowToGreenState.id]: yellowToGreenState,
            },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            greenUntilPhase7State.id
        ),
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: '1,59 m, blaue Augen, graue Haare',
                age: 65,
            },
            {
                injuries: 'äußerlich keine Verletzungen',
                bodyCheck: 'leichter Druckschmerzen im linkes Bein',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '89',
                skin: 'unauffällig',
                pain: 'keine',
                pupils: 'isocor',
                psyche: 'aufgeregt',
                hearing: 'unauffällig',
                isWalkable: true,
            },
            {
                [noChangesState.id]: noChangesState,
                [greenUntilPhase8State.id]: greenUntilPhase8State,
                [waitForYellowToGreenState.id]: waitForYellowToGreenState,
                [yellowToGreenState.id]: yellowToGreenState,
            },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            greenUntilPhase8State.id
        ),
    ]),

    // XDXDXA Patients
    PatientCategory.create('XDXDXA', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures:
                    'Spitzbart, blaue Augen, blonde Haare, 182 cm',
                age: 52,
            },
            {
                injuries:
                    'leicht blutende Wunde an der linken Hand, evt. Glassplitter in der Tiefe sichtbar; Prellmarke rechte Schläfe',
                bodyCheck: 'leichte Schmerzen beim Auftreten im linken Fuß',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '85; Puls gut tastbar',
                skin: 'unauffällig',
                pain: 'leichte',
                pupils: 'isocor',
                psyche: 'aufgeregt',
                hearing: 'unauffällig',
                isWalkable: true,
            },
            {
                [noChangesState.id]: noChangesState,
                [greenUntilPhase2State.id]: greenUntilPhase2State,
                [yellowFor2PhasesState.id]: yellowFor2PhasesState,
                [recoverToGreenState.id]: recoverToGreenState,
            },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            greenUntilPhase2State.id
        ),
    ]),

    // XAXAYB Patients
    PatientCategory.create('XAXAYB', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: '1,66 m, blond, blaue Augen',
                age: 30,
            },
            {
                injuries: 'Zeigefingeramputation rechts',
                bodyCheck: 'dezenter Druckschmerzen im rechten Bein',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '98; rhythmisch',
                skin: 'unauffällig',
                pain: 'keine',
                pupils: 'isocor',
                psyche: 'ängstlich',
                hearing: 'unauffällig',
                isWalkable: true,
            },
            {
                [noChangesState.id]: noChangesState,
                [greenUntilPhase9State.id]: greenUntilPhase9State,
                [greenStartPhase9RSDecisionState.id]:
                    greenStartPhase9RSDecisionState,
                [greenStartPhase10RADecisionState.id]:
                    greenStartPhase10RADecisionState,
                [greenStartPhase11RADecisionState.id]:
                    greenStartPhase11RADecisionState,
            },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            greenUntilPhase9State.id
        ),
    ]),

    // XDZBZC Patients
    PatientCategory.create('XDZBZC', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: 'graue Haare, blaue Augen, 1,69 m, Brille',
                age: 76,
            },
            {
                injuries: 'keine äußeren Verletzungen',
                bodyCheck:
                    'dezenter Druckschmerzen im linken Bein in Höhe der Patella',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '97; Puls gut tastbar',
                skin: 'warm, rot',
                pain: 'keine',
                pupils: 'isocor',
                psyche: 'sehr aufgeregt',
                hearing: 'unauffällig',
                isWalkable: true,
            },
            {
                [noChangesState.id]: noChangesState,
                [greenUntilPhase4State.id]: greenUntilPhase4State,
                [yellowToRedState.id]: yellowToRedState,
                [greenStartPhase5RADecisionState.id]:
                    greenStartPhase5RADecisionState,
                [waitForTransportState.id]: waitForTransportState,
            },
            defaultPatientImage,
            healthPointsDefaults.greenMax,
            greenUntilPhase4State.id
        ),
    ]),

    // YAXAXA Patients
    PatientCategory.create('YAXAXA', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures:
                    'dunkle Haare, braune Augen, Muttermal Stirn, 165 cm',
                age: 14,
            },
            {
                injuries:
                    'Kunststofffremdkörper linker Oberarm; Schulterfraktur links; Luxationsfraktur rechtes Handgelenk',
                bodyCheck: 'Risswunde am Hinterkopf; Hüftprellung rechts',
                breathing: 'unauffällig',
                awareness: 'wach, orientiert',
                pulse: '124; Puls kräftig',
                skin: 'unauffällig',
                pain: 'starke',
                pupils: 'isocor',
                psyche: 'aufgeregt',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [yellowUntilPhase5State.id]: yellowUntilPhase5State,
            },
            defaultPatientImage,
            healthPointsDefaults.yellowAverage,
            yellowUntilPhase5State.id
        ),
    ]),

    // YBXAXA Patients
    PatientCategory.create('YBXAXA', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures: 'blaue Augen, weiße Haare, 174 cm',
                age: 72,
            },
            {
                injuries:
                    'Fehlstellung linker Oberarm; offene Fraktur Unterarm links; große Platzwunde Kopf; Handquetschung links; Dialysepatient',
                bodyCheck:
                    'Schlüsselbeinfraktur rechts; Thoraxprellung auf der gleichen Seite',
                breathing: 'unauffällig',
                awareness: 'wach und orientiert',
                pulse: '122; Puls kräftig',
                skin: 'unauffällig',
                pain: 'starke',
                pupils: 'isocor',
                psyche: 'aufgeregt',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [yellowUntilPhase4State.id]: yellowUntilPhase4State,
                [recoverWithRSState.id]: recoverWithRSState,
            },
            defaultPatientImage,
            healthPointsDefaults.yellowAverage,
            yellowUntilPhase4State.id
        ),
    ]),

    // YBYAYA Patients
    PatientCategory.create('YBYAYA', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures: 'Vollbart, blond, blaue Augen, 1,87 m',
                age: 55,
            },
            {
                injuries:
                    'Prellmarke Unterschenkel rechts; Fehlstellung rechtes Sprunggelenk; Wunde Unterarm rechts',
                bodyCheck:
                    'Druckschmerz rechte Hüfte; Prellung Unterschenkel links',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '123; Puls flach',
                skin: 'kaltschweißig',
                pain: 'starke',
                pupils: 'isocor',
                psyche: 'aufgeregt',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [yellowUntilRedPhase4State.id]: yellowUntilRedPhase4State,
                [yellowStartPhase4RSDecisionState.id]:
                    yellowStartPhase4RSDecisionState,
            },
            defaultPatientImage,
            healthPointsDefaults.yellowAverage,
            yellowUntilRedPhase4State.id
        ),
    ]),

    // YAYBYA Patients
    PatientCategory.create('YAYBYA', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures: 'Glatze, graublaue Augen, Brille, 174 cm',
                age: 57,
            },
            {
                injuries:
                    'leicht blutende Wunde Unterarm links; grobe Fehlstellung rechtes Sprunggelenk; Prellmarke Unterschenkel rechts',
                bodyCheck:
                    'Druckschmerz linke Hüfte; Prellung Unterschenkel links; Schmerzen im Genitalbereich',
                breathing: 'unauffällig',
                awareness: 'wach aber verwirrt',
                pulse: '122; Puls kräftig',
                skin: 'kaltschweißig',
                pain: 'starke',
                pupils: 'isocor',
                psyche: 'hysterisch',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            { [noChangesState.id]: noChangesState },
            defaultPatientImage,
            healthPointsDefaults.yellowAverage,
            noChangesState.id
        ),
    ]),

    // YDYBYB Patients
    PatientCategory.create('YDYBYB', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures:
                    'graue Haare, Brille, braune Augen, ca. 1,70 m',
                age: 71,
            },
            {
                injuries:
                    'rechte Hand stark schmerzhaft; kleine blutende Platzwunde am Kopf; Glasfremdkörper am ganzen rechten Arm; unstillbares Nasenbluten',
                bodyCheck: 'Thoraxprellung links; Schlüsselbeinfraktur links',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '132; Puls kräftig',
                skin: 'kühl, blass',
                pain: 'starke',
                pupils: 'isocor',
                psyche: 'aggressiv',
                hearing: 'unauffällig',
                isWalkable: true,
            },
            {
                [noChangesState.id]: noChangesState,
                [yellowUntilPhase3State.id]: yellowUntilPhase3State,
                [redUntilYellowFor2PhasesState.id]:
                    redUntilYellowFor2PhasesState,
                [yellowFor3PhasesState.id]: yellowFor3PhasesState,
                [yellowStartPhase7RSDecisionState.id]:
                    yellowStartPhase7RSDecisionState,
                [yellowStartPhase8RADecisionState.id]:
                    yellowStartPhase8RADecisionState,
                [yellowStartPhase9RADecisionState.id]:
                    yellowStartPhase9RADecisionState,
            },
            defaultPatientImage,
            healthPointsDefaults.yellowAverage,
            yellowUntilPhase3State.id
        ),
    ]),

    // YCZCVE Patients
    PatientCategory.create('YCZCVE', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures:
                    'grüne Augen, grauhaarig, 1,68 m, adipös, Brille',
                age: 51,
            },
            {
                injuries:
                    'starke Schmerzen am linken Sprunggelenk; Prellmarke und Schürfwunde linker Unterschenkel',
                bodyCheck: 'Beckenprellung, Fraktur nicht auszuschließen',
                breathing: 'unauffällig',
                awareness: 'wach, verwirrt',
                pulse: '97; Puls gut tastbar',
                skin: 'kaltschweißig',
                pain: 'stärkste',
                pupils: 'isocor',
                psyche: 'hysterisch',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [yellowUntilPrioRedPhase4State.id]:
                    yellowUntilPrioRedPhase4State,
                [redUntilBlack2PhasesState.id]: redUntilBlack2PhasesState,
            },
            defaultPatientImage,
            healthPointsDefaults.yellowAverage,
            yellowUntilPrioRedPhase4State.id
        ),
    ]),

    // ZBZAZA Patients - Not Pregnant
    PatientCategory.create('ZBZAZA', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures: '1,86 m, Glatze, braune Augen, Brille',
                age: 60,
            },
            {
                injuries:
                    'Prellmarken linker Thorax; offene Oberarmfraktur rechts',
                bodyCheck:
                    'Rippenserienfraktur li.; Beckenprellung rechts; Hämatom hinter dem rechten Ohr; einseitig hebender Thorax rechts',
                breathing: 'flache Schonatmung',
                awareness: 'somnolent',
                pulse: '134; Puls fadenförmig',
                skin: 'zyanotisch',
                pain: 'stärkste',
                pupils: 'isocor',
                psyche: 'teilnahmslos',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [redUntilBlackPhase2State.id]: redUntilBlackPhase2State,
            },
            defaultPatientImage,
            healthPointsDefaults.redAverage,
            redUntilBlackPhase2State.id
        ),
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures: '1,84 m, braune Augen, Brille, braune Haare',
                age: 15,
            },
            {
                injuries:
                    'Weichteilquetschung rechter Unterschenkel, mäßig blutend, aber schon deutlicher Blutverlust',
                bodyCheck:
                    'Oberschenkelfraktur rechts; kleiner Eisenfremdkörper in der linken Hand',
                breathing: 'flache Atmung',
                awareness: 'somnolent',
                pulse: '154; Puls fadenförmig',
                skin: 'grau marmoriert',
                pain: 'stärkste',
                pupils: 'isocor',
                psyche: 'teilnahmslos',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [redUntilBlackPhase2State.id]: redUntilBlackPhase2State,
            },
            defaultPatientImage,
            healthPointsDefaults.redAverage,
            redUntilBlackPhase2State.id
        ),
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures:
                    '1,75 m, blonde Haare, blaue Augen, Brille, extrem adipös',
                age: 50,
            },
            {
                injuries:
                    'Kopfplatzwunde über dem Ohr; Prellmarke Stirn; Gesicht blutverschmiert',
                bodyCheck: 'Unterarmfraktur rechts',
                breathing: 'Atemwegsverlegung',
                awareness: 'bewusstlos, Massenbewegungen auf Schmerz',
                pulse: '85; gut tastbar',
                skin: 'tief zyanotisch',
                pain: 'entfällt',
                pupils: 'rechts weit',
                psyche: 'entfällt',
                hearing: 'entfällt',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [redUntilBlackPhase2State.id]: redUntilBlackPhase2State,
            },
            defaultPatientImage,
            healthPointsDefaults.redAverage,
            redUntilBlackPhase2State.id
        ),
    ]),

    // ZBZAZA Patients - Pregnant
    PatientCategory.create('ZBZAZAP', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: '1,72 m, braune Augen, blonde Haare',
                age: 25,
            },
            {
                injuries:
                    'offene Fraktur rechter Unterschenkel, nur noch mäßig blutend, aber schon großer Blutverlust; Wunde linke Schläfe; schwanger ca. 36 SSW',
                bodyCheck:
                    'schulternahe Oberarmfraktur rechts; linke Hand mit Fehlstellung im Handgelenk',
                breathing: 'flache Atmung',
                awareness: 'somnolent',
                pulse: '150; Puls fadenförmig',
                skin: 'grau marmoriert',
                pain: 'stärkste',
                pupils: 'isocor',
                psyche: 'teilnahmslos',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [redUntilBlackPhase2State.id]: redUntilBlackPhase2State,
            },
            defaultPatientImage,
            healthPointsDefaults.redAverage,
            redUntilBlackPhase2State.id
        ),
    ]),

    // ZBZCVE Patients
    PatientCategory.create('ZBZCVE', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures:
                    'graue Haare, Brille, grüne Augen, ca. 1,60 m',
                age: 80,
            },
            {
                injuries:
                    'große Weichteilquetschung linker Unterschenkel, nur noch mäßig blutend; aber schon deutlicher Blutverlust',
                bodyCheck:
                    'Oberarmfraktur rechts; fraglicher Fremdkörper rechte Hand in Wunde; blutende Prellmarke am Hinterkopf',
                breathing: 'flache Atmung',
                awareness: 'somnolent',
                pulse: '132; fadenförmig',
                skin: 'grau marmoriert',
                pain: 'stärkste',
                pupils: 'isocor',
                psyche: 'teilnahmslos',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [redUntilPhase2State.id]: redUntilPhase2State,
                [redIntoTransportFor2PhasesState.id]:
                    redIntoTransportFor2PhasesState,
                [redInstantTransportState.id]: redInstantTransportState,
            },
            defaultPatientImage,
            healthPointsDefaults.redAverage,
            redUntilPhase2State.id
        ),
    ]),

    // ZCZCVE Patients
    PatientCategory.create('ZCZCVE', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'male',
                externalFeatures: '1,78m, Bart, schwarzhaarig, braune Augen',
                age: 50,
            },
            {
                injuries:
                    'Teil-Amputation rechter Unterarm, spritzend blutend; schon großer Blutverlust',
                bodyCheck:
                    'geschlossene Oberschenkelfraktur links; Metallfremdkörper rechter Unterschenkel',
                breathing: 'flache Atmung',
                awareness: 'somnolent',
                pulse: '145; fadenförmig',
                skin: 'grau marmoriert',
                pain: 'stärkste',
                pupils: 'isocor',
                psyche: 'teilnahmslos',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [prioRedUntilPhase2State.id]: prioRedUntilPhase2State,
                [redInstantTransportState.id]: redInstantTransportState,
            },
            defaultPatientImage,
            healthPointsDefaults.redAverage,
            prioRedUntilPhase2State.id
        ),
    ]),

    // ZCVEVE Patients
    PatientCategory.create('ZCVEVE', defaultPatientImage, [
        newPatientTemplate(
            {
                sex: 'female',
                externalFeatures: '1,64 m, blaue Augen, blond',
                age: 55,
            },
            {
                injuries:
                    'starke Schmerzen im gesamten Abdomen mit gespannter Bauchdecke',
                bodyCheck:
                    'Prellmarken und Wunde linke Flanke; Rippenserienfraktur links',
                breathing: 'schwere Atemnot 30/min.',
                awareness: 'wach, verwirrt',
                pulse: '114; flach',
                skin: 'kühl, blass',
                pain: 'starke Bauchschmerzen',
                pupils: 'isocor',
                psyche: 'ängstlich',
                hearing: 'unauffällig',
                isWalkable: false,
            },
            {
                [noChangesState.id]: noChangesState,
                [redInstantTransportState.id]: redInstantTransportState,
            },
            defaultPatientImage,
            healthPointsDefaults.redAverage,
            redInstantTransportState.id
        ),
    ]),
];

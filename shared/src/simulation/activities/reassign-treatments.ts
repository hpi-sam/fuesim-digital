import type { Immutable, WritableDraft } from 'immer';
import { z } from 'zod';
import type { ExerciseState } from '../../state.js';
import type { CatersFor } from '../../store/action-reducers/utils/calculate-treatments.js';
import {
    couldCaterFor,
    removeTreatmentsOfElement,
    tryToCaterFor,
} from '../../store/action-reducers/utils/calculate-treatments.js';
import type { TreatmentProgress } from '../utils/treatment.js';
import { treatmentProgressSchema } from '../utils/treatment.js';
import { sendSimulationEvent } from '../events/utils.js';
import { defaultPersonnelTemplates } from '../../data/default-state/personnel-templates.js';
import type { Material } from '../../models/material.js';
import type { Patient } from '../../models/patient.js';
import {
    getPatientVisibleStatus,
    isPretriageStatusLocked,
} from '../../models/patient.js';
import { logTreatmentStatusChangedInSimulatedRegion } from '../../store/action-reducers/utils/log.js';
import type { UUID } from '../../utils/uuid.js';
import { isInSpecificSimulatedRegion } from '../../models/utils/position/position-helpers.js';
import { stringCompare } from '../../utils/string-compare.js';
import type { AssignLeaderBehaviorState } from '../behaviors/assign-leader.js';
import { newTreatmentProgressChangedEvent } from '../events/treatment-progress-changed.js';
import {
    addResourceDescription,
    ceilResourceDescription,
    maxResourceDescription,
    type ResourceDescription,
    scaleResourceDescription,
    subtractResourceDescription,
} from '../../models/utils/resource-description.js';
import { newPersonnelResource } from '../../models/utils/rescue-resource.js';
import { newResourceRequiredEvent } from '../events/resources-required.js';
import type { PatientStatus } from '../../models/utils/patient-status.js';
import type { Personnel } from '../../models/personnel.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { simulationActivityStateSchema } from './simulation-activity.js';
import type { SimulationActivity } from './simulation-activity.js';

export const reassignTreatmentsActivityStateSchema = z.strictObject({
    ...simulationActivityStateSchema.shape,
    type: z.literal('reassignTreatmentsActivity'),
    treatmentProgress: treatmentProgressSchema,
    countingStartedAt: z.int().nonnegative().optional(),
    countingTimePerPatient: z.int().nonnegative(),
});
export type ReassignTreatmentsActivityState = z.infer<
    typeof reassignTreatmentsActivityStateSchema
>;

export function newReassignTreatmentsActivityState(
    id: UUID,
    treatmentProgress: TreatmentProgress,
    countingTimePerPatient: number
): ReassignTreatmentsActivityState {
    return {
        id,
        type: 'reassignTreatmentsActivity',
        treatmentProgress,
        countingTimePerPatient,
        countingStartedAt: undefined,
    };
}

export const reassignTreatmentsActivity: SimulationActivity<ReassignTreatmentsActivityState> =
    {
        activityStateSchema: reassignTreatmentsActivityStateSchema,
        tick(draftState, simulatedRegion, activityState, _, terminate) {
            const patients = Object.values(draftState.patients)
                .filter((patient) =>
                    isInSpecificSimulatedRegion(patient, simulatedRegion.id)
                )
                .sort((a, b) => stringCompare(a.id, b.id));
            let personnel = Object.values(draftState.personnel).filter((pers) =>
                isInSpecificSimulatedRegion(pers, simulatedRegion.id)
            );
            const materials = Object.values(draftState.materials).filter(
                (material) =>
                    isInSpecificSimulatedRegion(material, simulatedRegion.id)
            );
            const progress = activityState.treatmentProgress;

            patients.forEach((patient) =>
                removeTreatmentsOfElement(draftState, patient)
            );

            const leaderId = (
                simulatedRegion.behaviors.find(
                    (behavior) => behavior.type === 'assignLeaderBehavior'
                ) as AssignLeaderBehaviorState | undefined
            )?.leaderId;

            let leaderIndex: number;
            if (
                !leaderId ||
                (leaderIndex = personnel.findIndex(
                    (pers) => pers.id === leaderId
                )) === -1
            ) {
                // No leader is present in the region.
                if (progress !== 'noTreatment') {
                    sendSimulationEvent(
                        simulatedRegion,
                        newTreatmentProgressChangedEvent('noTreatment')
                    );
                    logTreatmentStatusChangedInSimulatedRegion(
                        draftState,
                        'noTreatment',
                        simulatedRegion.id
                    );
                }
                terminate();
                return;
            }

            // The leader and other gfs do not treat patients
            personnel.splice(leaderIndex, 1);
            personnel = personnel.filter((pers) => pers.personnelType !== 'gf');

            if (personnel.length === 0) {
                terminate();
                return;
            }

            let allowTerminate = true;
            let missingPersonnel: ResourceDescription | undefined;

            switch (progress) {
                case 'noTreatment': {
                    // Since we've reached this line, there is a leader and other personnel so treatment can start
                    sendSimulationEvent(
                        simulatedRegion,
                        newTreatmentProgressChangedEvent('unknown')
                    );
                    logTreatmentStatusChangedInSimulatedRegion(
                        draftState,
                        'unknown',
                        simulatedRegion.id
                    );
                    break;
                }
                case 'unknown': {
                    const finished = count(draftState, activityState, patients);
                    if (finished) {
                        sendSimulationEvent(
                            simulatedRegion,
                            newTreatmentProgressChangedEvent('counted')
                        );
                        logTreatmentStatusChangedInSimulatedRegion(
                            draftState,
                            'counted',
                            simulatedRegion.id
                        );
                    }
                    allowTerminate = finished;
                    break;
                }
                case 'counted':
                case 'triaged':
                case 'secured': {
                    const shouldTriage = !allPatientsTriaged(patients);
                    if (shouldTriage) {
                        if (progress === 'counted') {
                            [, missingPersonnel] = triage(
                                draftState,
                                patients,
                                personnel,
                                materials
                            );
                        } else {
                            sendSimulationEvent(
                                simulatedRegion,
                                newTreatmentProgressChangedEvent('counted')
                            );
                            logTreatmentStatusChangedInSimulatedRegion(
                                draftState,
                                'counted',
                                simulatedRegion.id
                            );
                        }
                        break;
                    }

                    let secured: boolean;
                    [secured, missingPersonnel] = treat(
                        draftState,
                        patients,
                        personnel,
                        materials
                    );

                    if (secured && progress !== 'secured') {
                        sendSimulationEvent(
                            simulatedRegion,
                            newTreatmentProgressChangedEvent('secured')
                        );
                        logTreatmentStatusChangedInSimulatedRegion(
                            draftState,
                            'secured',
                            simulatedRegion.id
                        );
                        break;
                    }
                    if (!secured && progress !== 'triaged') {
                        sendSimulationEvent(
                            simulatedRegion,
                            newTreatmentProgressChangedEvent('triaged')
                        );
                        logTreatmentStatusChangedInSimulatedRegion(
                            draftState,
                            'triaged',
                            simulatedRegion.id
                        );
                        break;
                    }
                    break;
                }
            }

            if (missingPersonnel !== undefined) {
                const missingResource = newPersonnelResource(
                    ceilResourceDescription(missingPersonnel)
                );
                sendSimulationEvent(
                    simulatedRegion,
                    newResourceRequiredEvent(
                        simulatedRegion.id,
                        missingResource,
                        'reassignTreatmentsActivity'
                    )
                );
            }

            if (allowTerminate) {
                terminate();
            }
        },
    };

type TreatablePatientStatus = Exclude<
    PatientStatus,
    'black' | 'blue' | 'white'
>;

interface CateringMaterial {
    material: WritableDraft<Material>;
    catersFor: CatersFor;
}

interface CateringPersonnel {
    personnel: WritableDraft<Personnel>;
    priority: number;
    catersFor: CatersFor;
}

type PatientToPersonnelDict = {
    [patientId in UUID]: { [personnelType in string]?: UUID[] };
};

type PersonnelToPatientCategoryDict = {
    [personnelId in UUID]: {
        [personnelType in string]?: {
            [sk in TreatablePatientStatus]?: number;
        };
    };
};

interface PersonnelSubstitution {
    from: ResourceDescription;
    to: string;
}

function createCateringMaterials(
    materials: WritableDraft<Material>[]
): CateringMaterial[] {
    return materials.map((material) => ({
        material,
        catersFor: { red: 0, yellow: 0, green: 0 },
    }));
}

const personnelPriorities: { [key in string]: number } = {
    gf: 0,
    san: 1,
    rettSan: 2,
    notSan: 3,
    notarzt: 4,
};

const emptyPersonnelCounts = Object.fromEntries(
    Object.keys(personnelPriorities).map((personnelType) => [personnelType, 0])
);

// Estimation for required personnel based on the 7/2/1 rule.
const estimatedSkDistribution = { green: 7 / 10, yellow: 2 / 10, red: 1 / 10 };

// We only ever allow two patients to be treated by one personnel, except for notarzt
const capacities = Object.fromEntries(
    TypeAssertedObject.entries(defaultPersonnelTemplates).map(
        ([personnelType, { canCaterFor }]) => [
            personnelType,
            {
                red: Math.min(2, canCaterFor.red),
                yellow: Math.min(2, canCaterFor.yellow),
                green: Math.min(2, canCaterFor.green),
            },
        ]
    )
) as { [key in string]: ResourceDescription<TreatablePatientStatus> };
capacities['notarzt'] = {
    green: defaultPersonnelTemplates.notarzt.canCaterFor.green,
    red: defaultPersonnelTemplates.notarzt.canCaterFor.red,
    yellow: defaultPersonnelTemplates.notarzt.canCaterFor.yellow,
};

const minimumRequiredPersonnel: {
    [SK in TreatablePatientStatus]: Immutable<ResourceDescription>;
} = {
    red: {
        gf: 0,
        san: 0,
        rettSan: 1,
        notSan: 1,
        notarzt: 1 / capacities['notarzt'].red,
    },
    yellow: {
        gf: 0,
        san: 0,
        rettSan: 1,
        notSan: 0,
        notarzt: 1 / (capacities['notarzt'].yellow + capacities['notarzt'].red),
    },
    green: {
        gf: 0,
        san:
            1 /
            ((capacities['san']?.green ?? 0) +
                (capacities['san']?.yellow ?? 0) +
                (capacities['san']?.red ?? 0)),
        rettSan: 0,
        notSan: 0,
        notarzt: 0,
    },
};

const requiresExclusivity: {
    [SK in TreatablePatientStatus]?: { [Per in string]?: boolean };
} = {
    red: { rettSan: true, notSan: true },
    yellow: { rettSan: true },
};

// Ascending priority
const personnelTypePriorityList = TypeAssertedObject.entries(
    personnelPriorities
)
    .sort(([typeA, priorityA], [typeB, priorityB]) => priorityA - priorityB)
    .map(([personnelType]) => personnelType);
// Descending priority
const reversedPersonnelTypePriorityList = [
    ...personnelTypePriorityList,
].reverse();

function createCateringPersonnel(
    personnel: WritableDraft<Personnel>[]
): CateringPersonnel[] {
    return personnel.map((pers) => ({
        personnel: pers,
        priority: personnelPriorities[pers.personnelType] ?? -1,
        catersFor: {
            red: 0,
            yellow: 0,
            green: 0,
        },
    }));
}

/**
 * Performs the assignment logic for a stage in which the patients have to be counted.
 * @param draftState The state to operate in
 * @param activityState The state of the current activity
 * @param patients A list of the patients to operate on
 * @returns Whether all patients have been counted
 */
function count(
    draftState: WritableDraft<ExerciseState>,
    activityState: WritableDraft<ReassignTreatmentsActivityState>,
    patients: WritableDraft<Patient>[]
): boolean {
    if (activityState.countingStartedAt) {
        return (
            draftState.currentTime >=
            activityState.countingStartedAt +
                activityState.countingTimePerPatient * patients.length
        );
    }

    activityState.countingStartedAt = draftState.currentTime;
    return false;
}

/**
 * Performs the assignment logic for a stage in which the patients have to be triaged.
 * In this stage, triage is prioritized over treatment, meaning that even red patients might not be treated in order to triage all patients as fast as possible.
 * @param draftState The state to operate in
 * @param patients A list of the patients to operate on
 * @param personnel A list of the personnel to operate on
 * @param materials A list of the patients to operate on
 * @returns Whether all patients are triaged and estimated numbers of personnel that is missing to secure treatment
 */
function triage(
    draftState: WritableDraft<ExerciseState>,
    patients: WritableDraft<Patient>[],
    personnel: WritableDraft<Personnel>[],
    materials: WritableDraft<Material>[]
): [boolean, ResourceDescription] {
    const patientsToTreat: WritableDraft<Patient>[] = [];
    const cateringPersonnel = createCateringPersonnel(personnel).sort(
        (a, b) => a.priority - b.priority
    );
    const emptyPersonnelCount = { ...emptyPersonnelCounts };
    const triagePersonnelSubstitution: PersonnelSubstitution[] = [];

    patients.forEach((patient) => {
        if (isPretriageStatusLocked(patient)) {
            patientsToTreat.push(patient);
            return;
        }

        const triagePersonnelIndex = cateringPersonnel.findIndex(
            (pers) =>
                hasNoTreatments(pers) &&
                tryToCaterFor(
                    pers.personnel,
                    pers.catersFor,
                    patient,
                    draftState.configuration.pretriageEnabled,
                    draftState.configuration.bluePatientsEnabled
                )
        );

        if (triagePersonnelIndex !== -1) {
            // Personnel that is used for triage shall not be used for treatments
            const triagePersonnel = cateringPersonnel.splice(
                triagePersonnelIndex,
                1
            );
            // But we can get it back
            triagePersonnelSubstitution.push({
                to: triagePersonnel[0]!.personnel.personnelType,
                from: emptyPersonnelCount,
            });
        }
    });

    const missingPersonnel = estimateRequiredPersonnel(
        patients.length - patientsToTreat.length,
        personnel
    );
    let [, treatmentMissingPersonnel] = assignTreatments(
        draftState,
        patientsToTreat,
        cateringPersonnel,
        materials
    );

    treatmentMissingPersonnel = applySubstitutions(
        treatmentMissingPersonnel,
        triagePersonnelSubstitution
    );

    const triageDone = patientsToTreat.length === patients.length;
    return [
        triageDone,
        addResourceDescription(missingPersonnel, treatmentMissingPersonnel),
    ];
}

/**
 * Performs the assignment logic for a stage in which the patients have to be treated for.
 * In this stage, patients are prioritized by their triage status.
 * @param draftState The state to operate in
 * @param patients A list of the patients to operate on
 * @param personnel A list of the personnel to operate on
 * @param materials A list of the patients to operate on
 * @returns Whether the treatment for all patients is secured and numbers of personnel that is missing to secure treatment.
 */
function treat(
    draftState: WritableDraft<ExerciseState>,
    patients: WritableDraft<Patient>[],
    personnel: WritableDraft<Personnel>[],
    materials: WritableDraft<Material>[]
): [boolean, ResourceDescription] {
    return assignTreatments(
        draftState,
        patients,
        createCateringPersonnel(personnel),
        materials
    );
}

/**
 * Groups an array by a property selected from an element.
 * @param array The array to group.
 * @param keySelector A function returning the grouping property for a given element.
 * @returns An object of keys mapped to arrays.
 */
function groupBy<T, K extends number | string | symbol>(
    array: T[],
    keySelector: (t: T) => K
): { [Key in K]?: T[] } {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const map = {} as { [Key in K]?: T[] };

    array.forEach((element) => {
        const key = keySelector(element);

        if (!map[key]) {
            map[key] = [];
        }

        map[key]!.push(element);
    });

    return map;
}

/**
 * Checks whether the `catersFor` property of the specified {@link cateringPersonnel} is set to zero for all statuses.
 */
function hasNoTreatments(cateringPersonnel: CateringPersonnel): boolean {
    return (
        cateringPersonnel.catersFor.red === 0 &&
        cateringPersonnel.catersFor.yellow === 0 &&
        cateringPersonnel.catersFor.green === 0
    );
}

/**
 * Checks whether the `catersFor` property of the specified {@link cateringPersonnel} is set to zero for all statuses higher than {@link status}.
 */
function hasNoHigherTreatments(
    cateringPersonnel: CateringPersonnel,
    status: TreatablePatientStatus
): boolean {
    if (status === 'green') {
        return (
            cateringPersonnel.catersFor.red === 0 &&
            cateringPersonnel.catersFor.yellow === 0
        );
    }

    if (status === 'yellow') return cateringPersonnel.catersFor.red === 0;

    return true;
}

/**
 * Determines the overall amount of patients the {@link cateringPersonnel} is treating.
 */
function sumOfTreatments(cateringPersonnel: CateringPersonnel): number {
    return (
        cateringPersonnel.catersFor.red +
        cateringPersonnel.catersFor.yellow +
        cateringPersonnel.catersFor.green
    );
}

/**
 * Determines if {@link patients} contains no patient that is not triaged.
 */
function allPatientsTriaged(patients: Patient[]): boolean {
    return patients.every(isPretriageStatusLocked);
}

/**
 * Selects the best personnel to treat a specific patient.
 * This function tries to find a personnel of the requested type and prefers personnel that is not treating any other patient.
 * If there is no personnel of the requested type (neither "exclusive" nor treating other patients but having some capacity left), the next higher type will be checked by the same pattern.
 * @param groupedPersonnel Available personnel, grouped by their personnelType
 * @param minType The minimum required personnel type for the patient
 * @param patientStatus The status of the patient
 * @param maxPatients The maximum number of patients the selected personnel may be treating after assigning the new patient
 * @param mixWithHigherStatus Whether the patient may be assigned to a personnel that is already treating patients with a more urgent status
 * @returns An object specifying the assignable personnel and whether the personnel is treating the current patient exclusively, if an assignable personnel was found.
 *  `undefined` otherwise.
 */
function findAssignablePersonnel(
    groupedPersonnel: {
        [Key in string]?: CateringPersonnel[];
    },
    minType: string,
    patientStatus: TreatablePatientStatus,
    maxPatients: number,
    mixWithHigherStatus = true
): { personnel: CateringPersonnel; isExclusive: boolean } | undefined {
    const exclusivePersonnel = groupedPersonnel[minType]?.find((personnel) =>
        hasNoTreatments(personnel)
    );

    if (exclusivePersonnel) {
        return { personnel: exclusivePersonnel, isExclusive: true };
    }

    const availablePersonnel = groupedPersonnel[minType]?.find(
        (personnel) =>
            sumOfTreatments(personnel) < maxPatients &&
            couldCaterFor(
                patientStatus,
                personnel.personnel,
                personnel.catersFor
            ) &&
            (mixWithHigherStatus ||
                hasNoHigherTreatments(personnel, patientStatus))
    );

    if (availablePersonnel) {
        return { personnel: availablePersonnel, isExclusive: false };
    }

    const nextType =
        personnelTypePriorityList[
            personnelTypePriorityList.indexOf(minType) + 1
        ];
    if (nextType === undefined) {
        return undefined;
    }
    return findAssignablePersonnel(
        groupedPersonnel,
        nextType,
        patientStatus,
        maxPatients,
        mixWithHigherStatus
    );
}

/**
 * Performs the actual assignment of personnel and material to patients.
 * This function tries to reach matching in which every red patient is treated by a notSan and a rettSan exclusively, each yellow patient is treated by a rettSan exclusively and each two green patients are treated by a san.
 * Additionally, each red and yellow patient should be treated by a notarzt (non-exclusively) and material should be assigned.
 * @param draftState The state to operate in
 * @param patients A list of the patients to operate on
 * @param cateringPersonnel A list of the personnel to operate on.
 *  Personnel may be treating some other patients already, expressed by the catersFor property.
 * @param materials A list of the materials to operate on.
 * @returns Whether the treatment for all patients is secured and numbers of personnel that is missing to secure treatment.
 */
function assignTreatments(
    draftState: WritableDraft<ExerciseState>,
    patients: WritableDraft<Patient>[],
    cateringPersonnel: CateringPersonnel[],
    materials: WritableDraft<Material>[]
): [boolean, ResourceDescription] {
    const groupedPatients = groupBy(patients, (patient) =>
        getPatientVisibleStatus(
            patient,
            draftState.configuration.pretriageEnabled,
            draftState.configuration.bluePatientsEnabled
        )
    );

    const groupedPersonnel = groupBy(
        cateringPersonnel,
        (personnel) => personnel.personnel.personnelType
    );

    const patientTreatments: PatientToPersonnelDict = {};
    const personnelTreatments: PersonnelToPatientCategoryDict = {};

    const treatmentContext = {
        groupedPersonnel,
        draftState,
        personnelTreatments,
        patientTreatments,
    };

    groupedPatients.red?.forEach((patient) => {
        tryAssignPersonnel(patient, 'red', 'notSan', treatmentContext);
        tryAssignPersonnel(patient, 'red', 'rettSan', treatmentContext);
    });

    groupedPatients.yellow?.forEach((patient) => {
        tryAssignPersonnel(patient, 'yellow', 'rettSan', treatmentContext);
    });

    groupedPatients.green?.forEach((patient) => {
        tryAssignPersonnel(patient, 'green', 'san', treatmentContext, false);
    });

    const cateringMaterials = createCateringMaterials(materials);

    // A notarzt may be used to replace a lower tier personnel if there is not enough
    // In this case, we consider the notarzt to be more occupied that by it's normal work so we don't want to use them here
    const remainingNotarzts =
        groupedPersonnel['notarzt']?.filter((notarzt) =>
            hasNoTreatments(notarzt)
        ) ?? [];

    [
        ...(groupedPatients.red?.map((patient) => ['red', patient] as const) ??
            []),
        ...(groupedPatients.yellow?.map(
            (patient) => ['yellow', patient] as const
        ) ?? []),
    ].forEach(([visibleStatus, patient]) => {
        // Usually, notarzts are needed for some specific tasks, but they do not have to treat a patient continuously and exclusively.
        // Therefore, we can just use this simple approach based on their normal treatment capacity
        remainingNotarzts.some((notarzt) => {
            if (
                tryToCaterFor(
                    notarzt.personnel,
                    notarzt.catersFor,
                    patient,
                    draftState.configuration.pretriageEnabled,
                    draftState.configuration.bluePatientsEnabled
                )
            ) {
                recordPatientTreatedByPersonnel(
                    patient.id,
                    visibleStatus,
                    notarzt.personnel.id,
                    'notarzt',
                    treatmentContext
                );
                return true;
            }
            return false;
        });
    });

    [
        ...(groupedPatients.red ?? []),
        ...(groupedPatients.yellow ?? []),
        ...(groupedPatients.green ?? []),
    ].forEach((patient) => {
        // More material does not lead to any benefit and the material does not have any different qualification/capabilities.
        // Therefore, we can just use this simple approach to assign the material, beginning by the most urgent patients.
        cateringMaterials.some((material) =>
            tryToCaterFor(
                material.material,
                material.catersFor,
                patient,
                draftState.configuration.pretriageEnabled,
                draftState.configuration.bluePatientsEnabled
            )
        );
    });

    const [secured, missingPersonnel] = calculateMissingPersonnel(
        groupedPatients,
        cateringPersonnel,
        personnelTreatments,
        patientTreatments
    );
    return [secured, missingPersonnel];
}

function tryAssignPersonnel(
    patient: WritableDraft<Patient>,
    patientStatus: TreatablePatientStatus,
    minType: string,
    context: {
        groupedPersonnel: { [K in string]?: CateringPersonnel[] };
        personnelTreatments: PersonnelToPatientCategoryDict;
        patientTreatments: PatientToPersonnelDict;
        draftState: WritableDraft<ExerciseState>;
    },
    mixWithHigherStatus = true,
    maxPatients: number = 2
) {
    const { groupedPersonnel, draftState } = context;
    const assignablePersonnel = findAssignablePersonnel(
        groupedPersonnel,
        minType,
        patientStatus,
        maxPatients,
        mixWithHigherStatus
    );

    if (assignablePersonnel) {
        tryToCaterFor(
            assignablePersonnel.personnel.personnel,
            assignablePersonnel.personnel.catersFor,
            patient,
            draftState.configuration.pretriageEnabled,
            draftState.configuration.bluePatientsEnabled
        );
        recordPatientTreatedByPersonnel(
            patient.id,
            patientStatus,
            assignablePersonnel.personnel.personnel.id,
            minType,
            context
        );
    }
}

function recordPatientTreatedByPersonnel(
    patientId: UUID,
    patientStatus: TreatablePatientStatus,
    personnelId: UUID,
    minType: string,
    context: {
        personnelTreatments: PersonnelToPatientCategoryDict;
        patientTreatments: PatientToPersonnelDict;
    }
) {
    const { personnelTreatments, patientTreatments } = context;
    personnelTreatments[personnelId] ??= {};
    personnelTreatments[personnelId][minType] ??= {};
    personnelTreatments[personnelId][minType][patientStatus] =
        (personnelTreatments[personnelId][minType][patientStatus] ?? 0) + 1;

    patientTreatments[patientId] ??= {};
    patientTreatments[patientId][minType] ??= [];
    patientTreatments[patientId][minType].push(personnelId);
}

/**
 * Computes an estimation of required personnel based on the number of patients and typical MCI rules of thumb.
 * @param patients patients to treat, ignoring their triage status
 * @param personnel available personnel
 * @returns the types and number of personnel estimated to missing to secure treatment
 */
function estimateRequiredPersonnel(
    patientCount: number,
    personnel: Personnel[]
): ResourceDescription {
    const groupedPersonnel = groupBy(personnel, (p) => p.personnelType);
    const havePersonnel: ResourceDescription = Object.fromEntries(
        TypeAssertedObject.keys(personnelPriorities).map((pt) => [
            pt,
            groupedPersonnel[pt]?.length ?? 0,
        ])
    );
    const wantPersonnel = requiredPersonnelForPatients(
        scaleResourceDescription(estimatedSkDistribution, patientCount)
    );

    // We want the missing personnel exactly, no substitution of personnel qualification takes place.
    return maxResourceDescription(
        subtractResourceDescription(wantPersonnel, havePersonnel),
        0
    );
}

function requiredPersonnelForPatients(
    patientCounts: ResourceDescription<TreatablePatientStatus>
): ResourceDescription {
    const requiredByType = Object.fromEntries(
        TypeAssertedObject.entries(patientCounts).map(
            ([patientType, patientCount]) => [
                patientType,
                scaleResourceDescription(
                    minimumRequiredPersonnel[patientType],
                    patientCount
                ),
            ]
        )
    );
    const result = addResourceDescription(
        addResourceDescription(
            requiredByType['red']!,
            requiredByType['yellow']!
        ),
        // Green should not be mixed. Therefore we ceil them before merging.
        ceilResourceDescription(requiredByType['green']!)
    );
    result['notarzt'] = Math.max(
        requiredByType['red']!['notarzt'] ?? 0,
        requiredByType['yellow']!['notarzt'] ?? 0
    );
    return result;
}

function calculateMissingPersonnel(
    groupedPatients: { [Key in TreatablePatientStatus]?: Patient[] },
    personnel: CateringPersonnel[],
    personnelTreatments: PersonnelToPatientCategoryDict,
    patientTreatments: PatientToPersonnelDict
) {
    const cateringPersonnelDict = Object.fromEntries(
        personnel.map((cateringPersonnel) => [
            cateringPersonnel.personnel.id,
            cateringPersonnel,
        ])
    );

    const patientStatusMissingPersonnel = Object.fromEntries(
        (['red', 'yellow', 'green'] as const).map((patientStatus) => {
            const patients = groupedPatients[patientStatus] ?? [];

            let statusMissingPersonnel = { ...emptyPersonnelCounts };
            patients.forEach((patient) => {
                const patientMissingPersonnel = cloneDeepMutable(
                    minimumRequiredPersonnel[patientStatus]
                );

                personnelTypePriorityList.forEach((personnelType) => {
                    (patientTreatments[patient.id]?.[personnelType] ?? [])
                        .map(
                            (personnelId) => cateringPersonnelDict[personnelId]
                        )
                        .forEach((p) => {
                            if (p) {
                                patientMissingPersonnel[personnelType] ??= 0;
                                patientMissingPersonnel[personnelType] -=
                                    1 /
                                    (requiresExclusivity[patientStatus]?.[
                                        personnelType
                                    ]
                                        ? sumOfTreatments(p)
                                        : p.catersFor[patientStatus]);
                            }
                        });
                });
                statusMissingPersonnel = addResourceDescription(
                    statusMissingPersonnel,
                    maxResourceDescription(patientMissingPersonnel, 0)
                );
            });
            return [patientStatus, statusMissingPersonnel] as const;
        })
    ) as { [K in TreatablePatientStatus]: ResourceDescription };

    const totalMissingPersonnel = addResourceDescription(
        addResourceDescription(
            patientStatusMissingPersonnel.red,
            patientStatusMissingPersonnel.yellow
        ),
        ceilResourceDescription(patientStatusMissingPersonnel.green)
    );

    totalMissingPersonnel['notarzt'] = Math.max(
        patientStatusMissingPersonnel.red['notarzt'] ?? 0,
        patientStatusMissingPersonnel.yellow['notarzt'] ?? 0
    );

    const secured = TypeAssertedObject.values(totalMissingPersonnel).every(
        (cnt) => cnt <= 0
    );

    if (secured) {
        return [secured, totalMissingPersonnel] as const;
    }

    // Try to substitute missing personnel to request low priorities if that helps.
    // For example, if we need notarzt and one is treating a green patient, we request a san instead.
    const finalMissingPersonnel = calculateSubstitutedMissingPersonnel(
        totalMissingPersonnel,
        cateringPersonnelDict,
        personnelTreatments
    );
    return [secured, finalMissingPersonnel] as const;
}

function calculateSubstitutedMissingPersonnel(
    missingPersonnel: ResourceDescription,
    cateringDict: { [k: string]: CateringPersonnel },
    personnelTreatments: PersonnelToPatientCategoryDict
): ResourceDescription {
    const substitutions = TypeAssertedObject.entries(personnelTreatments)
        .map(
            ([persId, roles]) =>
                [cateringDict[persId]!.personnel.personnelType, roles] as const
        )
        .filter(([realPersonnelType, roles]) =>
            TypeAssertedObject.keys(roles).some(
                (personnelType) => personnelType !== realPersonnelType
            )
        )
        .map(([realPersonnelType, roles]) => {
            const from = Object.fromEntries(
                personnelTypePriorityList.map((personnelType) => {
                    const role = roles[personnelType];
                    const requiredPersonnelCount = role
                        ? TypeAssertedObject.keys(role)
                              .map(
                                  (patientType) =>
                                      (role[patientType] ?? 0) /
                                      capacities[personnelType]![patientType]
                              )
                              .reduce((a, b) => Math.max(a, b), 0)
                        : 0;

                    return [personnelType, requiredPersonnelCount];
                })
            ) as ResourceDescription;
            return { from, to: realPersonnelType };
        });

    return applySubstitutions(missingPersonnel, substitutions);
}

function applySubstitutions(
    missing: ResourceDescription,
    substitutions: PersonnelSubstitution[]
) {
    let stillMissing = { ...missing };
    reversedPersonnelTypePriorityList.forEach((personnelType) => {
        while ((stillMissing[personnelType] ?? 0) > 0) {
            const substitutionIndex = substitutions.findIndex(
                (s) => s.to === personnelType
            );
            if (substitutionIndex === -1) break;
            const substitution = substitutions.splice(substitutionIndex, 1)[0]!;
            stillMissing[substitution.to]! -= 1;

            stillMissing = addResourceDescription(
                stillMissing,
                substitution.from
            );
        }
    });
    return maxResourceDescription(stillMissing, 0);
}

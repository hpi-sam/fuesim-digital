import { type WritableDraft } from 'immer';
import type { ExerciseState } from '../state.js';
import type { UUID } from '../utils/uuid.js';
import type { Personnel } from '../models/personnel.js';
import {
    currentCoordinatesOf,
    isWithinExtent,
} from '../models/utils/position/position-helpers.js';
import { getElement } from '../store/action-reducers/utils/get-element.js';
import type { TechnicalChallenge } from '../models/technical-challenge/technical-challenge.js';
import type { TaskType } from '../models/task-type.js';
import { TypeAssertedObject } from '../utils/type-asserted-object.js';
import type { StateMachine } from '../models/technical-challenge/state-machine.js';

// TODO: maybe only remove personnelId
export function getAssignmentsOnTechnicalChallenge(
    technicalChallenge: TechnicalChallenge
): {
    personnelId: Personnel['id'];
    stateMachineId: StateMachine['id'];
    taskTypeId: TaskType['id'];
}[] {
    return Object.values(technicalChallenge.stateMachines).flatMap(
        (stateMachine) =>
            TypeAssertedObject.entries(stateMachine.assignedPersonnel).map(
                ([personnelId, taskTypeId]) => ({
                    personnelId,
                    taskTypeId,
                    stateMachineId: stateMachine.id,
                })
            )
    );
}

export function unassignPersonnelFromTechnicalChallenge(
    personnelId: Personnel['id'],
    technicalChallenge: WritableDraft<TechnicalChallenge>
): void {
    const result = getAssignmentsOnTechnicalChallenge(technicalChallenge).find(
        (assignment) => assignment.personnelId === personnelId
    );

    if (!result) {
        return;
    }

    delete technicalChallenge.stateMachines[result.stateMachineId]!
        .assignedPersonnel[personnelId];
}

export function isPersonnelAssigned(
    personnelId: Personnel['id'],
    technicalChallenge: TechnicalChallenge
): boolean {
    return Object.values(technicalChallenge.stateMachines)
        .flatMap((stateMachine) => Object.keys(stateMachine.assignedPersonnel))
        .includes(personnelId);
}

function isPersonnelAssignedFilter(personnelId: UUID) {
    return (technicalChallenge: TechnicalChallenge) =>
        isPersonnelAssigned(personnelId, technicalChallenge);
}

function getAssignmentsOfPersonnel(
    personnelId: UUID,
    state: WritableDraft<ExerciseState>
): WritableDraft<TechnicalChallenge>[];
function getAssignmentsOfPersonnel(
    personnelId: UUID,
    state: ExerciseState
): TechnicalChallenge[];
function getAssignmentsOfPersonnel(
    personnelId: UUID,
    state: ExerciseState | WritableDraft<ExerciseState>
): TechnicalChallenge[] | WritableDraft<ExerciseState>[] {
    return Object.values(state.technicalChallenges).filter(
        isPersonnelAssignedFilter(personnelId)
    );
}

function isValidAssignment(
    personnel: Personnel,
    challenge: TechnicalChallenge
): boolean {
    return isWithinExtent(challenge, currentCoordinatesOf(personnel));
}

export function removeInvalidAssignments(
    personnelId: UUID,
    draftState: WritableDraft<ExerciseState>
): void {
    const challenges = getAssignmentsOfPersonnel(personnelId, draftState);
    const personnel = getElement(draftState, 'personnel', personnelId);

    const invalidChallenges = challenges.filter(
        (c) => !isValidAssignment(personnel, c)
    );
    invalidChallenges.forEach((challenge) => {
        unassignPersonnelFromTechnicalChallenge(personnelId, challenge);
    });
}

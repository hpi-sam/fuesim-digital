import type { WritableDraft } from 'immer';
import type { UUID } from '../utils/index.js';
import type { ExerciseState } from '../state.js';
import type { Personnel, TechnicalChallenge } from '../models/index.js';
import { currentCoordinatesOf, isWithinExtent } from '../models/index.js';
import { getElement } from '../store/action-reducers/utils/index.js';

function isPersonnelAssigned(
    personnelId: UUID,
    technicalChallenge: TechnicalChallenge
): boolean {
    return Object.hasOwn(technicalChallenge.assignedPersonnel, personnelId);
}

function isPersonnelAssignedFilter(personnelId: UUID) {
    return (technicalChallenge: TechnicalChallenge) =>
        isPersonnelAssigned(personnelId, technicalChallenge);
}

function getAssignmentsOfPersonnel(
    personnelId: UUID,
    state: ExerciseState
): TechnicalChallenge[] {
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
): WritableDraft<ExerciseState> {
    const challenges = getAssignmentsOfPersonnel(personnelId, draftState);
    const personnel = getElement(draftState, 'personnel', personnelId);

    const invalidChallenges = challenges.filter(
        (c) => !isValidAssignment(personnel, c)
    );
    invalidChallenges.forEach(
        (challenge) => delete challenge.assignedPersonnel[personnelId]
    );

    return draftState;
}

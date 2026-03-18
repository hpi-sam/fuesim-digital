import type { WritableDraft } from 'immer';
import type { UUID } from '../utils/index.js';
import type { ExerciseState } from '../state.js';
import type { Personnel, TechnicalChallenge } from '../models/index.js';
import { currentCoordinatesOf, isWithinExtent } from '../models/index.js';
import { getElement } from '../store/action-reducers/utils/index.js';

const isPersonnelAssigned = (
    personnelId: UUID,
    technicalChallenge: TechnicalChallenge
): boolean => Object.hasOwn(technicalChallenge.assignedPersonnel, personnelId);
const isPersonnelAssignedFilter =
    (personnelId: UUID) => (technicalChallenge: TechnicalChallenge) =>
        isPersonnelAssigned(personnelId, technicalChallenge);

const getAssignmentsOfPersonnel = (
    personnelId: UUID,
    state: ExerciseState
): TechnicalChallenge[] =>
    Object.values(state.technicalChallenges).filter(
        isPersonnelAssignedFilter(personnelId)
    );

const isValidAssignment = (
    personnel: Personnel,
    challenge: TechnicalChallenge
): boolean => isWithinExtent(challenge, currentCoordinatesOf(personnel));

export const removeInvalidAssignments = (
    personnelId: UUID,
    draftState: WritableDraft<ExerciseState>
): WritableDraft<ExerciseState> => {
    const challenges = getAssignmentsOfPersonnel(personnelId, draftState);
    const personnel = getElement(draftState, 'personnel', personnelId);

    console.log(`total assignments ${challenges.length}`);
    const invalidChallenges = challenges.filter(
        (c) => !isValidAssignment(personnel, c)
    );
    invalidChallenges.forEach(
        (challenge) => delete challenge.assignedPersonnel[personnelId]
    );
    console.log(
        `removed personnel from ${invalidChallenges.length} assignments.`
    );

    return draftState;
};

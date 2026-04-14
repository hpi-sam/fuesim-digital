import type { Immutable, WritableDraft } from 'immer';
import { produce } from 'immer';
import type { ParticipantKey } from '../../exercise-keys.js';
import { ExerciseState } from '../../state.js';
import { getDefaultTechnicalChallengeTemplate } from '../../data/index.js';
import { StateMachineTesting } from '../../data/default-state/tmp-default-technical-challenge.js';
import {
    lookupReducerFor,
    TechnicalChallengeActionReducers,
} from '../../store/index.js';
import { newPersonnelFromTemplate } from '../personnel.js';
import { defaultPersonnelTemplates } from '../../data/default-state/personnel-templates.js';
import { uuid } from '../../utils/index.js';
import {
    currentCoordinatesOf,
    newMapCoordinatesAt,
    newMapPositionAt,
    newNoPosition,
} from '../utils/index.js';
import { simulateAllTechnicalChallenges } from './state-machine.js';
import { newTechnicalChallengeFromTemplate } from './technical-challenge-template.js';
import assignPersonnelToTechnicalChallenge = TechnicalChallengeActionReducers.assignPersonnelToTechnicalChallenge;

const tickInterval = 1000;
const simulateOneTick = produce((draftState: WritableDraft<ExerciseState>) => {
    lookupReducerFor('[Exercise] Tick').reducer(draftState, {
        type: '[Exercise] Tick',
        tickInterval,
        patientUpdates: [],
        refreshTreatments: true,
    });
});
function simulateNTicks(
    state: Immutable<ExerciseState>,
    n: number
): Immutable<ExerciseState> {
    let newState = state;
    for (let i = 0; i < n; i++) {
        newState = simulateOneTick(newState);
    }
    return newState;
}

const emptyState: Immutable<ExerciseState> = ExerciseState.create(
    '123456' as ParticipantKey
);
const challengeTemplate = getDefaultTechnicalChallengeTemplate();
const challenge = {
    ...newTechnicalChallengeFromTemplate(challengeTemplate),
    position: newMapPositionAt(newMapCoordinatesAt(0, 0)),
};
const personnel = newPersonnelFromTemplate(
    defaultPersonnelTemplates.san,
    uuid(),
    'no-vehicle',
    newNoPosition()
);

const initialState: Immutable<ExerciseState> = produce(
    emptyState,
    (draftState) => {
        draftState.technicalChallenges[challenge.id] = challenge;
        draftState.personnel[personnel.id] = personnel;
    }
);

// for easy debugging of failing tests:
let stateDict = '<state uuid>                        \t<state title>';
for (const state of Object.values(challenge.states)) {
    stateDict += `\n${state.id}\t${state.title}`;
}
console.log(stateDict);

describe('TechnicalChallenges', () => {
    it('should not progress unassigned tasks', () => {
        const state = simulateOneTick(initialState);
        const resultingTechnicalChallenge =
            state.technicalChallenges[challenge.id];

        expect(
            resultingTechnicalChallenge!.taskProgress[
                StateMachineTesting.rescuePatientTask.id
            ]
        ).toBe(0);
        expect(
            resultingTechnicalChallenge!.taskProgress[
                StateMachineTesting.extinguishFireTask.id
            ]
        ).toBe(0);
    });

    it('should progress assigned tasks', () => {
        const assignPersonnel = produce(
            assignPersonnelToTechnicalChallenge.reducer
        );
        const withPersonnel = assignPersonnel(initialState, {
            type: '[TechnicalChallenge] Assign a personnel to technical challenge',
            technicalChallengeId: challenge.id,
            personnelId: personnel.id,
            taskId: StateMachineTesting.extinguishFireTask.id,
            targetPosition: currentCoordinatesOf(challenge),
        });
        const oneTickState = simulateOneTick(withPersonnel);
        const oneTickChallenge = oneTickState.technicalChallenges[challenge.id];
        expect(
            oneTickChallenge?.taskProgress[
                StateMachineTesting.extinguishFireTask.id
            ]
        ).toBe(tickInterval);
        expect(
            oneTickChallenge?.taskProgress[
                StateMachineTesting.rescuePatientTask.id
            ]
        ).toBe(0);
        expect(oneTickChallenge?.currentStateId).toBe(
            StateMachineTesting.initialState.id
        );

        const tenTickState = simulateNTicks(oneTickState, 9);
        const tenTickChallenge = tenTickState.technicalChallenges[challenge.id];
        expect(tenTickChallenge?.currentStateId).toBe(
            StateMachineTesting.onlyExtinguished.id
        );
        expect(
            tenTickChallenge?.taskProgress[
                StateMachineTesting.extinguishFireTask.id
            ]
        ).toBe(tickInterval * 10);
        expect(
            tenTickChallenge?.taskProgress[
                StateMachineTesting.rescuePatientTask.id
            ]
        ).toBe(0);
    });

    it('should transition on fulfilled timer guards', () => {
        const patientDeadState = simulateNTicks(initialState, 30);
        const patientDeadChallenge =
            patientDeadState.technicalChallenges[challenge.id];

        expect(patientDeadChallenge?.currentStateId).toBe(
            StateMachineTesting.onlyDead.id
        );

        const bothFailedState = simulateNTicks(patientDeadState, 30);
        const bothFailedChallenge =
            bothFailedState.technicalChallenges[challenge.id];
        expect(bothFailedChallenge?.currentStateId).toBe(
            StateMachineTesting.burnedOutAndPatientDead.id
        );
    });
});

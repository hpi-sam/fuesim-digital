import type { Immutable, WritableDraft } from 'immer';
import { produce } from 'immer';
import type { ParticipantKey } from '../../exercise-keys.js';
import { ExerciseState } from '../../state.js';
import {
    getDefaultTechnicalChallengeTemplate,
    StateMachineTesting,
} from '../../data/default-state/tmp-default-technical-challenge.js';
import { newPersonnelFromTemplate } from '../personnel.js';
import { defaultPersonnelTemplates } from '../../data/default-state/personnel-templates.js';
import { lookupReducerFor } from '../../store/action-reducers/action-reducers.js';
import { newMapPositionAt } from '../utils/position/map-position.js';
import { newNoPosition } from '../utils/position/no-position.js';
import { currentCoordinatesOf } from '../utils/position/position-helpers.js';
import { newMapCoordinatesAt } from '../utils/position/map-coordinates.js';
import { uuid } from '../../utils/uuid.js';
import { isPersonnelAssigned } from '../../state-helpers/technical-challenge-assignment.js';
import { newTechnicalChallengeFromTemplate } from './technical-challenge-template.js';

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
const assignPersonnel = produce(
    lookupReducerFor(
        '[TechnicalChallenge] Assign a personnel to technical challenge'
    ).reducer
);

const emptyState: Immutable<ExerciseState> = ExerciseState.create(
    '123456' as ParticipantKey
);
const challengeTemplate = getDefaultTechnicalChallengeTemplate();
const challenge = {
    ...newTechnicalChallengeFromTemplate(challengeTemplate, 0),
    position: newMapPositionAt(newMapCoordinatesAt(0, 0)),
};
const personnelA = newPersonnelFromTemplate(
    defaultPersonnelTemplates.san,
    uuid(),
    'no-vehicle',
    newNoPosition()
);
const personnelB = newPersonnelFromTemplate(
    defaultPersonnelTemplates.san,
    uuid(),
    'no-vehicle',
    newNoPosition()
);

const initialState: Immutable<ExerciseState> = produce(
    emptyState,
    (draftState) => {
        draftState.technicalChallenges[challenge.id] = challenge;
        draftState.personnel[personnelA.id] = personnelA;
        draftState.personnel[personnelB.id] = personnelB;
    }
);

const stateWithAssignedPersonnel: Immutable<ExerciseState> = assignPersonnel(
    initialState,
    {
        type: '[TechnicalChallenge] Assign a personnel to technical challenge',
        technicalChallengeId: challenge.id,
        personnelId: personnelA.id,
        taskId: StateMachineTesting.extinguishFireTask.id,
        targetPosition: currentCoordinatesOf(challenge),
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
        const oneTickState = simulateOneTick(stateWithAssignedPersonnel);
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

    it('should check timer guards relative to the time of their creation', () => {
        const alreadyRunning = simulateNTicks(initialState, 60);
        const newChallenge = {
            ...newTechnicalChallengeFromTemplate(
                challengeTemplate,
                alreadyRunning.currentTime
            ),
            position: newMapPositionAt(newMapCoordinatesAt(0, 0)),
        };
        const withNewChallenge = produce(alreadyRunning, (draft) => {
            lookupReducerFor(
                '[TechnicalChallenge] Create technical challenge'
            ).reducer(draft, {
                type: '[TechnicalChallenge] Create technical challenge',
                technicalChallenge: newChallenge,
            });
        });

        const currentState = (state: Immutable<ExerciseState>) =>
            state.technicalChallenges[newChallenge.id]?.currentStateId;

        expect(currentState(withNewChallenge)).toBe(
            StateMachineTesting.initialState.id
        );

        const withNewChallenge1 = simulateOneTick(withNewChallenge);
        expect(currentState(withNewChallenge1)).toBe(
            StateMachineTesting.initialState.id
        );

        const patientDeadState = simulateNTicks(withNewChallenge1, 29);
        expect(currentState(patientDeadState)).toBe(
            StateMachineTesting.onlyDead.id
        );

        const bothFailedState = simulateNTicks(patientDeadState, 30);
        expect(currentState(bothFailedState)).toBe(
            StateMachineTesting.burnedOutAndPatientDead.id
        );
    });

    it('should unassign personnel, if the assigned task is completed', () => {
        const oneTickState = simulateOneTick(stateWithAssignedPersonnel);
        const multipleAssignmentsState = assignPersonnel(oneTickState, {
            type: '[TechnicalChallenge] Assign a personnel to technical challenge',
            technicalChallengeId: challenge.id,
            targetPosition: currentCoordinatesOf(challenge),
            taskId: StateMachineTesting.rescuePatientTask.id,
            personnelId: personnelB.id,
        });
        const onlyExtinguishedState = simulateNTicks(
            multipleAssignmentsState,
            9
        );
        const onlyExtinguishedChallenge =
            onlyExtinguishedState.technicalChallenges[challenge.id]!;

        expect(
            isPersonnelAssigned(personnelA.id, onlyExtinguishedChallenge)
        ).toBeFalse();
        expect(
            isPersonnelAssigned(personnelB.id, onlyExtinguishedChallenge)
        ).toBeTrue();

        const bothDoneState = simulateOneTick(onlyExtinguishedState);
        expect(
            isPersonnelAssigned(
                personnelB.id,
                bothDoneState.technicalChallenges[challenge.id]!
            )
        ).toBeFalse();
    });

    it('should unassign personnel, if the assigned task is no more available', () => {
        const secondsBeforeStateChange =
            StateMachineTesting.isPatientDead.minTimePassed / 1_000;
        const nearlyStateChangedState = simulateNTicks(
            initialState,
            secondsBeforeStateChange - 1
        );

        const tooLateAssignedState = assignPersonnel(nearlyStateChangedState, {
            type: '[TechnicalChallenge] Assign a personnel to technical challenge',
            technicalChallengeId: challenge.id,
            personnelId: personnelA.id,
            taskId: StateMachineTesting.rescuePatientTask.id,
            targetPosition: currentCoordinatesOf(challenge),
        });

        expect(
            isPersonnelAssigned(
                personnelA.id,
                tooLateAssignedState.technicalChallenges[challenge.id]!
            )
        ).toBeTrue();
        const taskCancelledState = simulateOneTick(tooLateAssignedState);

        expect(
            isPersonnelAssigned(
                personnelA.id,
                taskCancelledState.technicalChallenges[challenge.id]!
            )
        ).toBeFalse();
    });
});

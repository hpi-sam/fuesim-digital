import type { WritableDraft } from 'immer';
import { produce } from 'immer';
import type { ParticipantKey } from '../../exercise-keys.js';
import type { ExerciseState } from '../../state.js';
import { newExerciseState } from '../../state.js';
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
import { getTaskProgress } from './state-machine.js';

const tickInterval = 1000;
const simulateOneTick = produce((draftState: WritableDraft<ExerciseState>) => {
    lookupReducerFor('[Exercise] Tick').reducer(draftState, {
        type: '[Exercise] Tick',
        tickInterval,
        patientUpdates: [],
        refreshTreatments: true,
    });
});
function simulateNTicks(state: ExerciseState, n: number): ExerciseState {
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

const emptyState: ExerciseState = newExerciseState('123456' as ParticipantKey);
const challengeTemplate = getDefaultTechnicalChallengeTemplate();
const challenge = {
    ...newTechnicalChallengeFromTemplate(challengeTemplate, 0),
    position: newMapPositionAt(newMapCoordinatesAt(0, 0)),
};
const stateMachine = Object.values(challenge.stateMachines).at(0)!;
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

const initialState: ExerciseState = produce(emptyState, (draftState) => {
    draftState.technicalChallenges[challenge.id] = challenge;
    draftState.personnel[personnelA.id] = personnelA;
    draftState.personnel[personnelB.id] = personnelB;
});

const stateWithAssignedPersonnel: ExerciseState = assignPersonnel(
    initialState,
    {
        type: '[TechnicalChallenge] Assign a personnel to technical challenge',
        technicalChallengeId: challenge.id,
        stateMachineId: stateMachine.id,
        personnelId: personnelA.id,
        taskId: StateMachineTesting.extinguishFireTask.id,
        targetPosition: currentCoordinatesOf(challenge),
    }
);

// for easy debugging of failing tests:
let stateDict = '<state uuid>                        \t<state title>';
for (const state of Object.values(stateMachine.states)) {
    stateDict += `\n${state.id}\t${state.title}`;
}
console.log(stateDict);

describe('TechnicalChallenges', () => {
    it('should not progress unassigned tasks', () => {
        const state = simulateOneTick(initialState);
        const resultingStateMachine =
            state.technicalChallenges[challenge.id]!.stateMachines[
                stateMachine.id
            ]!;

        expect(
            getTaskProgress(
                StateMachineTesting.rescuePatientTask.id,
                resultingStateMachine
            )
        ).toStrictEqual({ timeSpent: 0, progressPercentage: 0 });
        expect(
            getTaskProgress(
                StateMachineTesting.extinguishFireTask.id,
                resultingStateMachine
            )
        ).toStrictEqual({ timeSpent: 0, progressPercentage: 0 });
    });

    it('should progress assigned tasks', () => {
        const oneTickState = simulateOneTick(stateWithAssignedPersonnel);
        const oneTickSM =
            oneTickState.technicalChallenges[challenge.id]?.stateMachines[
                stateMachine.id
            ];
        expect(
            getTaskProgress(
                StateMachineTesting.extinguishFireTask.id,
                oneTickSM!
            ).timeSpent
        ).toBe(tickInterval);
        expect(
            getTaskProgress(
                StateMachineTesting.rescuePatientTask.id,
                oneTickSM!
            ).timeSpent
        ).toBe(0);
        expect(oneTickSM?.currentStateId).toBe(
            StateMachineTesting.initialState.id
        );

        const tenTickState = simulateNTicks(oneTickState, 9);
        const tenTickSM =
            tenTickState.technicalChallenges[challenge.id]?.stateMachines[
                stateMachine.id
            ];
        expect(tenTickSM?.currentStateId).toBe(
            StateMachineTesting.onlyExtinguished.id
        );
        expect(
            getTaskProgress(
                StateMachineTesting.extinguishFireTask.id,
                tenTickSM!
            ).timeSpent
        ).toBe(tickInterval * 10);
        expect(
            getTaskProgress(
                StateMachineTesting.rescuePatientTask.id,
                tenTickSM!
            ).timeSpent
        ).toBe(0);
    });

    it('should transition on fulfilled timer guards', () => {
        const patientDeadState = simulateNTicks(initialState, 30);
        const patientDeadSM =
            patientDeadState.technicalChallenges[challenge.id]!.stateMachines[
                stateMachine.id
            ]!;

        expect(patientDeadSM.currentStateId).toBe(
            StateMachineTesting.onlyDead.id
        );

        const bothFailedState = simulateNTicks(patientDeadState, 30);
        const bothFailedSM =
            bothFailedState.technicalChallenges[challenge.id]!.stateMachines[
                stateMachine.id
            ]!;
        expect(bothFailedSM.currentStateId).toBe(
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
        const newStateMachine = Object.values(newChallenge.stateMachines).at(
            0
        )!;

        const currentState = (state: ExerciseState) =>
            state.technicalChallenges[newChallenge.id]?.stateMachines[
                newStateMachine.id
            ]?.currentStateId;

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
            stateMachineId: stateMachine.id,
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
            StateMachineTesting.patientDeadTimerDuration / 1_000;
        const nearlyStateChangedState = simulateNTicks(
            initialState,
            secondsBeforeStateChange - 1
        );

        const tooLateAssignedState = assignPersonnel(nearlyStateChangedState, {
            type: '[TechnicalChallenge] Assign a personnel to technical challenge',
            technicalChallengeId: challenge.id,
            stateMachineId: stateMachine.id,
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

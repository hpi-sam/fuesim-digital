import type { Migration } from './migration-functions.js';

interface StateMachineOld {
    states: object;
    relevantTasks: object;
    transitions: object;
    simulationStartTime: number;
}
interface StateMachineNew {
    id: string;
    name: string;
    states: object;
    initialStateId: string;
    tasks: object;
    timers: object;
    simulationStartTime: number;
    currentStateId: string;
    taskTimeSpent: object;
    assignedPersonnel: object;
}
interface TechnicalChallengeOld extends StateMachineOld {
    name: string;
    taskProgress: object;
    currentStateId: string;
    assignedPersonnel: object;
}

export const allowMultipleStatemachines57: Migration = {
    action: (intermediaryState, action) => {
        const typedAction = action as {
            type: '[TechnicalChallenge] Update state content';
            stateMachineId: string | undefined;
        };
        switch (typedAction.type) {
            case '[TechnicalChallenge] Update state content':
                typedAction.stateMachineId;
        }
    },

    state: (state) => {
        const typedState = state as {
            tasks: object | undefined;
            taskTypes: object | undefined;
            technicalChallenges: { [key: string]: TechnicalChallengeOld };
        };

        // migrate tasktype rename
        typedState.taskTypes = typedState.tasks;
        delete typedState.tasks;

        // migrate state machines
        for (const challenge of Object.values(typedState.technicalChallenges)) {
            // TODO migrate tasks to new layout
            const newTasks: {[]}

            // TODO: somehow generate timer???
            const newStateMachine: StateMachineNew = {
                id: '',
                name: challenge.name,
                taskTimeSpent: challenge.taskProgress,
                currentStateId: challenge.currentStateId,
                initialStateId: challenge.currentStateId, // warning!
                assignedPersonnel: challenge.assignedPersonnel,
                states: challenge.states,
                tasks: challenge.relevantTasks,
                simulationStartTime: challenge.simulationStartTime,
                timers:
            };
        }
    },
};

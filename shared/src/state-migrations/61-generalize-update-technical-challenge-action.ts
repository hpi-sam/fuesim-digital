import { cloneDeepMutable } from '../utils/clone-deep.js';
import type { Migration } from './migration-functions.js';

interface Action {
    type: '[TechnicalChallenge] Update state content';
    technicalChallengeId: string;
    stateMachineId: string;
    stateId: string;
    userGeneratedContent: any;
}

interface NewAction {
    type: '[TechnicalChallenge] Update technical challenge';
    updatedTechnicalChallenge: any;
}

export const updateTechnicalChallenges61: Migration = {
    state: (s) => s,
    action: (intermediaryState, action) => {
        if (
            (action as any).type === '[TechnicalChallenge] Update state content'
        ) {
            const typedAction = action as Action;
            const challenge = cloneDeepMutable(
                intermediaryState.technicalChallenges[
                    typedAction.technicalChallengeId
                ]
            );
            if (!challenge) {
                return false;
            }
            const newAction = action as NewAction;
            const stateMachine =
                challenge.stateMachines[typedAction.stateMachineId as any];
            if (!stateMachine) {
                return false;
            }
            const state = stateMachine.states[typedAction.stateId as any];
            if (!state) {
                return false;
            }

            state.userGeneratedContent = typedAction.userGeneratedContent;

            newAction.type = '[TechnicalChallenge] Update technical challenge';
            newAction.updatedTechnicalChallenge = challenge;

            const oldAction = typedAction as Partial<Action>;
            delete oldAction.technicalChallengeId;
            delete oldAction.stateMachineId;
            delete oldAction.stateId;
            delete oldAction.userGeneratedContent;
        }

        return true;
    },
};

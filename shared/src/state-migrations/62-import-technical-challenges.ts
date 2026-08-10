import type { Migration } from './migration-functions.js';

function migratePrimaryStateMachine(challengeOrTemplate: any): void {
    const primaryStateMachine = Object.values<any>(
        challengeOrTemplate.stateMachines
    ).at(0)!;
    challengeOrTemplate.primaryStateMachineId = primaryStateMachine.id;
}

function migrateTemplateStateMachines(template: any): void {
    for (const stateMachine of Object.values<any>(template.stateMachines)) {
        delete stateMachine.currentStateId;
        delete stateMachine.simulationStartTime;
        delete stateMachine.taskTimeSpent;
        delete stateMachine.assignedPersonnel;
    }
}

export const importTechnicalChallenges: Migration = {
    state: (state: any) => {
        for (const challenge of Object.values<any>(state.technicalChallenges)) {
            delete challenge.image;
            migratePrimaryStateMachine(challenge);
        }

        for (const template of Object.values(
            state.technicalChallengeTemplates
        )) {
            migratePrimaryStateMachine(template);
            migrateTemplateStateMachines(template);
        }
    },
    action: (_, action: any) => {
        switch (action.type) {
            case '[TechnicalChallengeTemplate] Update template':
                migratePrimaryStateMachine(
                    action.updatedTechnicalChallengeTemplate
                );
                migrateTemplateStateMachines(
                    action.updatedTechnicalChallengeTemplate
                );
                break;
            case '[TechnicalChallenge] Create technical challenge':
                delete action.technicalChallenge.image;
                migratePrimaryStateMachine(action.technicalChallenge);
                break;
            case '[TechnicalChallenge] Update technical challenge':
                delete action.updatedTechnicalChallenge.image;
                migratePrimaryStateMachine(action.updatedTechnicalChallenge);
        }
        return true;
    },
};

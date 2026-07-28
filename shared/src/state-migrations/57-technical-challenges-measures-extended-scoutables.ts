import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface UserGeneratedContent {
    content: string;
}

interface Scoutable {
    name?: string;
    viewedByParticipants?: boolean;
    userGeneratedContent?: UserGeneratedContent;
}

function isEmptyContent(content: string | undefined): boolean {
    return content === '' || content === '<p></p>';
}

export const technicalChallengesMeasuresExtendedScoutables57: Migration = {
    action: (intermediateState, action) => {
        const typedAction = action as { type: string };
        if (typedAction.type === '[Scoutable] Make scoutable') {
            const typedScoutableAction = action as {
                scoutable: Scoutable;
            };
            typedScoutableAction.scoutable.name = '';
            typedScoutableAction.scoutable.viewedByParticipants = false;
        } else if (typedAction.type === '[Scoutable] Update content') {
            const typedUpdateAction = action as {
                scoutableId: UUID;
                userGeneratedContent?: UserGeneratedContent;
            };
            if (
                isEmptyContent(typedUpdateAction.userGeneratedContent?.content)
            ) {
                const typedState = intermediateState as {
                    patients: { [key in UUID]: { scoutableId: UUID | null } };
                    mapImages: { [key in UUID]: { scoutableId: UUID | null } };
                };

                let elementType: string | undefined;
                let elementId: string | undefined;

                for (const [id, patient] of Object.entries(
                    typedState.patients
                )) {
                    if (patient.scoutableId === typedUpdateAction.scoutableId) {
                        elementType = 'patient';
                        elementId = id;
                        break;
                    }
                }

                if (elementType === undefined) {
                    for (const [id, mapImage] of Object.entries(
                        typedState.mapImages
                    )) {
                        if (
                            mapImage.scoutableId ===
                            typedUpdateAction.scoutableId
                        ) {
                            elementType = 'mapImage';
                            elementId = id;
                            break;
                        }
                    }
                }

                if (elementType !== undefined && elementId !== undefined) {
                    const mutableAction = action as {
                        type: string;
                        elementType: string;
                        elementId: string;
                        scoutableId?: unknown;
                        userGeneratedContent?: unknown;
                    };
                    mutableAction.type = '[Scoutable] Remove scoutability';
                    mutableAction.elementType = elementType;
                    mutableAction.elementId = elementId;
                    delete mutableAction.scoutableId;
                    delete mutableAction.userGeneratedContent;
                }
            }
        }
        return true;
    },
    state: (state: any) => {
        const typedState = state as {
            scoutables: { [key in UUID]: Scoutable };
            patients: { [key in UUID]: { scoutableId: UUID | null } };
            mapImages: { [key in UUID]: { scoutableId: UUID | null } };
        };

        state.technicalChallenges = {};
        state.technicalChallengeTemplates = {};
        state.taskTypes = {};
        state.measures = {};
        state.measureTemplates = {};
        state.drawings = {};

        Object.values(typedState.scoutables).forEach((scoutable) => {
            scoutable.name = '';
            scoutable.viewedByParticipants = false;
        });

        const emptyContentScoutableIds = new Set(
            Object.entries(typedState.scoutables)
                .filter(([_, scoutable]) =>
                    isEmptyContent(scoutable.userGeneratedContent?.content)
                )
                .map(([id]) => id)
        );

        emptyContentScoutableIds.forEach(
            (id) =>
                delete (typedState.scoutables as { [key: string]: unknown })[id]
        );

        Object.values(typedState.patients).forEach((patient) => {
            if (
                patient.scoutableId !== null &&
                emptyContentScoutableIds.has(patient.scoutableId)
            ) {
                patient.scoutableId = null;
            }
        });

        Object.values(typedState.mapImages).forEach((mapImage) => {
            if (
                mapImage.scoutableId !== null &&
                emptyContentScoutableIds.has(mapImage.scoutableId)
            ) {
                mapImage.scoutableId = null;
            }
        });
    },
};

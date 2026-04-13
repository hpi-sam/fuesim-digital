import type {
    MapImage,
    Patient,
    Task,
    TechnicalChallenge,
} from '../models/index.js';
import type { UUID } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

export const addTechnicalChallenges51: Migration = {
    action: (intermediateState, action) => {
        const typedAction = action as { type: string };
        switch (typedAction.type) {
            case '[Patient] Add patient': {
                const typedPatientAction = action as {
                    patient: Patient;
                };
                typedPatientAction.patient.scoutableId = null;
                break;
            }
            case '[MapImage] Add MapImage': {
                const typedMapImageAction = action as {
                    mapImage: MapImage;
                };
                typedMapImageAction.mapImage.scoutableId = null;
                break;
            }
            default:
                break;
        }
        return true;
    },
    state: (state: any) => {
        const typedState = state as {
            technicalChallenges:
                | { [key: UUID]: TechnicalChallenge }
                | undefined;
            tasks: { [key: UUID]: Task } | undefined;
        };

        typedState.technicalChallenges = {};
        typedState.tasks = {};
    },
};

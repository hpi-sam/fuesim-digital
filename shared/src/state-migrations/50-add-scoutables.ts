import { MapImage } from '../models/map-image.js';
import { Patient } from '../models/patient.js';
import type { UUID } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

export const addScoutables50: Migration = {
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
    state: (state) => {
        const typedState = state as {
            scoutables: { [key in UUID]: any } | undefined;

            userGeneratedContents: { [key in UUID]: any } | undefined;
            patients: { [key in UUID]: { scoutableId: null | undefined } };
            mapImages: { [key in UUID]: { scoutableId: null | undefined } };
        };

        typedState.scoutables = {};
        typedState.userGeneratedContents = {};
        Object.values(typedState.patients).forEach((patient) => {
            patient.scoutableId = null;
        });
        Object.values(typedState.mapImages).forEach((mapImages) => {
            mapImages.scoutableId = null;
        });
    },
};

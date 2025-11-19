import {
    createEmergencyOperationsViewport,
    emergencyOperationsViewportId,
} from '../data/default-state/emergency-operations-viewport.js';
import type { Migration } from './migration-functions.js';

export const addEmergencyOperationsCenterViewport43: Migration = {
    action: (_intermediaryState, action) => {
        if (
            (action as { type: string }).type ===
            '[Emergency Operation Center] Add Log Entry'
        ) {
            const typedAction = action as {
                isPrivate?: boolean;
            };
            // We assume that the log entries were written by a
            // leader for notes on the running exercise and
            // therefore set them to private
            typedAction.isPrivate ??= true;
        }
        return true;
    },

    state: (state) => {
        const typedState = state as {
            viewports: {
                [uuid: string]: { viewportType: 'default' | 'eoc' };
            };
            eocLog: {
                isPrivate?: boolean;
            }[];
        };

        for (const viewportId of Object.keys(typedState.viewports)) {
            const viewport = typedState.viewports[viewportId]!;
            viewport.viewportType = 'default';
        }

        typedState.viewports[emergencyOperationsViewportId] =
            createEmergencyOperationsViewport();

        for (const logEntry of typedState.eocLog) {
            logEntry.isPrivate ??= true;
        }
    },
};

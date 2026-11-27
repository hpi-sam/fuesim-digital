import { ZodError, z } from 'zod';

import { exportImportFileSchema } from '../export-import/file-format/export-import-file.js';
import type { StateExport } from '../export-import/file-format/state-export.js';
import { stateExportSchema } from '../export-import/file-format/state-export.js';
import {
    type PartialExport,
    partialExportSchema,
} from '../export-import/file-format/partial-export.js';
import { type ExerciseState, exerciseStateSchema } from '../state.js';
import {
    actionTypeSchema,
    type ExerciseAction,
    lookupReducerFor,
} from './action-reducers/action-reducers.js';

export class ValidationError extends Error {
    constructor(
        private readonly zodError: ZodError,
        private readonly failedObj: unknown
    ) {
        super();
        this.zodError = zodError;
        this.failedObj = failedObj;
    }

    getMessage(): string {
        return `Validation of\n\n${JSON.stringify(this.failedObj, undefined, 2)}\n\nfailed with error:\n\n${this.zodError.message}`;
    }
}

export class ActionValidationError extends ValidationError {}
export class ExerciseStateValidationError extends ValidationError {}

/**
 *
 * @param maybeAction A JSON object that should be checked for validity.
 * @returns An array of errors validating {@link maybeAction}. An empty array indicates a valid action object.
 */
export function validateExerciseAction(maybeAction: object): ExerciseAction {
    const maybeActionWithType = z
        .object({ type: actionTypeSchema })
        .parse(maybeAction);

    const reducer = lookupReducerFor(maybeActionWithType.type);

    try {
        return reducer.actionSchema.parse(maybeAction, { reportInput: true });
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ActionValidationError(error, maybeAction);
        }
        throw error;
    }
}

/**
 *
 * @param maybeState An JSON object that should be checked for validity.
 * @returns An array of errors validating {@link action}. An empty array indicates a valid action object.
 */
export function validateExerciseState(maybeState: unknown): ExerciseState {
    try {
        return exerciseStateSchema.parse(maybeState, { reportInput: true });
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ExerciseStateValidationError(error, maybeState);
        }
        throw error;
    }
}

/**
 *
 * @param exportImportFile A JSON object that should be checked for validity.
 * @returns Correctly typed partial or state export.
 */
export function validateExerciseExport(
    exportImportFile: object
): PartialExport | StateExport {
    const parsedFile = exportImportFileSchema.parse(exportImportFile);
    switch (parsedFile.type) {
        case 'partial':
            return partialExportSchema.parse(exportImportFile);
        case 'complete': {
            return stateExportSchema.parse(exportImportFile);
        }
    }
}

import { plainToInstance } from 'class-transformer';
import type { ValidationError } from 'class-validator';
import { validateSync } from 'class-validator';
import type { ExportImportFile } from '../export-import/file-format/index.js';
import {
    PartialExport,
    CompleteExport,
} from '../export-import/file-format/index.js';
import type { Constructor } from '../utils/index.js';
import { defaultValidateOptions } from './validation-options.js';

/**
 *
 * @param exportImportFile A json object that should be checked for validity.
 * @returns An array of errors validating {@link exportImportFile}. An empty array indicates a valid `ExportImportFile` object.
 */
export function validateExerciseExport(
    exportImportFile: ExportImportFile
): (ValidationError | string)[] {
    // Be aware that `exportImportFile` could be any json object. We need to program defensively here.
    if (typeof exportImportFile.type !== 'string') {
        return ['Export/import type is not a string.'];
    }
    const exportImportClass = {
        complete: CompleteExport,
        partial: PartialExport,
    }[exportImportFile.type];
    // if the exportImportFile.type is not a valid exportImportClass type, the exportImportClass is undefined.
    // Defensive, see comment above
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!exportImportClass) {
        return [`Unknown export/import type: ${exportImportFile.type}`];
    }

    const exportImportFileInstance = plainToInstance(
        exportImportClass as Constructor<ExportImportFile>,
        exportImportFile
    );
    const validationErrors = validateSync(
        exportImportFileInstance,
        defaultValidateOptions
    );
    return validationErrors;
}

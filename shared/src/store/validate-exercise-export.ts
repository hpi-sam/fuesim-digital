import { exportImportFileSchema } from '../export-import/file-format/export-import-file.js';
import type { StateExport } from '../export-import/file-format/state-export.js';
import { stateExportSchema } from '../export-import/file-format/state-export.js';
import {
    type PartialExport,
    partialExportSchema,
} from '../export-import/file-format/partial-export.js';

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

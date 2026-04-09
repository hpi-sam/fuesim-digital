import * as z from 'zod';
import type { Immutable } from 'immer';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { patientSchema } from './patient.js';
import { mapImageSchema } from './map-image.js';

export const scoutableSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('scoutable'),
    userGeneratedContentId: uuidSchema.nullable(),
    isVisibleForParticipants: z.boolean(),
});
export type Scoutable = Immutable<z.infer<typeof scoutableSchema>>;

/* When adding a new ElementType (refered to as it) to become a functioning Scoutable element, do the following:
1) add the scoutableId attribute to its class;
2) add its ElementSchema to scoutableElementSchema;
3) add its type string to scoutableElemntKeys for the indicators
4) modify its popup component to include the scoutable nav tab.
    You might want the scoutable indicator to navigate to the scoutble nav directly,
    so refer to the mapImages popup component for a simple implemtation.
*/
export const scoutableElementSchema = z.union([mapImageSchema, patientSchema]);
export type ScoutableElement = z.infer<typeof scoutableElementSchema>;

export const scoutableElementKeys = [
    'patient',
    'mapImage',
] satisfies Array<ScoutableElementType>;

export type ScoutableElementType = ScoutableElement['type'];

export function newScoutable(): Scoutable {
    return {
        id: uuid(),
        type: 'scoutable',
        userGeneratedContentId: null,
        isVisibleForParticipants: true,
    };
}

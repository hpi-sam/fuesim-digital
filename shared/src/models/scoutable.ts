import * as z from 'zod';
import type { Immutable } from 'immer';
import { uuid } from '../utils/uuid.js';
import type { Patient } from './patient.js';
import type { MapImage } from './map-image.js';

export const scoutableSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('scoutable'),
    userGeneratedContentId: z.uuidv4().nullable(),
    isPaticipantVisible: z.boolean(),
});
export type Scoutable = Immutable<z.infer<typeof scoutableSchema>>;

/* When adding a new ElementType (refered to as it) to become a functioning Scoutable element, do the following:
1) add the scoutableId attribute to its class;
2) add its ElementType to ScoutableElement;
3) add its type string to scoutableElemntKeys for the indicators
4) modify its popup component to include the scoutable nav tab.
    You might want the scoutable indicator to navigate to the scoutble nav directly,
    so refer to the mapImages popup component for a simple implemtation.
*/
export type ScoutableElement = MapImage | Patient;

export const scoutableElementKeys = [
    'patient',
    'mapImage',
] as Array<ScoutableElementType>;

export type ScoutableElementType = ScoutableElement['type'];

export function newScoutable(): Scoutable {
    return {
        id: uuid(),
        type: 'scoutable',
        userGeneratedContentId: null,
        isPaticipantVisible: true,
    };
}

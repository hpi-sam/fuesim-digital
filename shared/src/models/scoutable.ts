import * as z from 'zod';
import type { Immutable } from 'immer';
import { uuid } from '../utils/uuid.js';
import type { Patient } from './patient.js';
import type { Vehicle } from './vehicle.js';

export const scoutableSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('scoutable'),
    userGeneratedContentIds: z.array(z.uuidv4()),
});
export type Scoutable = Immutable<z.infer<typeof scoutableSchema>>;

export type ScoutableElement = Patient | Vehicle;

export type ScoutableElementType = ScoutableElement['type'];

export function newScoutable(): Scoutable {
    return {
        id: uuid(),
        type: 'scoutable',
        userGeneratedContentIds: [],
    };
}

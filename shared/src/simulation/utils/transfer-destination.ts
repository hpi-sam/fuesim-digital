import { z } from 'zod';
import type { Immutable } from 'immer';

export const transferDestinationTypeAllowedValues = [
    'hospital',
    'transferPoint',
] as const;

export const transferDestinationTypeSchema = z.literal(
    transferDestinationTypeAllowedValues
);
export type TransferDestination = Immutable<
    z.infer<typeof transferDestinationTypeSchema>
>;

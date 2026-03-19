import { z } from 'zod';

export const transferDestinationTypeAllowedValues = [
    'hospital',
    'transferPoint',
] as const;

export const transferDestinationTypeSchema = z.literal(
    transferDestinationTypeAllowedValues
);
export type TransferDestination = z.infer<typeof transferDestinationTypeSchema>;

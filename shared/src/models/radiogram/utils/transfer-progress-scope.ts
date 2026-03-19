import { z } from 'zod';

/**
 * Defines the scope of the radiogram on the transfer progress.
 * * `singleRegion`: The information is only about the simulated region that sent the radiogram
 * * `transportManagement`: The information is about all simulated regions that are managed
 *   by the transport management behavior of the simulated region that sent the radiogram
 */

export const transferProgressScopeAllowedValues = [
    'singleRegion',
    'transportManagement',
] as const;

export const transferProgressScopeSchema = z.literal(
    transferProgressScopeAllowedValues
);
export type TransferProgressScope = z.infer<typeof transferProgressScopeSchema>;

import { z } from 'zod';

export const exportImportFileSchema = z.object({
    type: z.literal(['complete', 'partial']),
    fileVersion: z.int().nonnegative(),
    dataVersion: z.int().nonnegative(),
});

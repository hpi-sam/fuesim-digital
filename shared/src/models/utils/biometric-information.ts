import { z } from 'zod';
import { sexSchema } from './sex.js';

export const biometricInformationSchema = z.strictObject({
    age: z.int().nonnegative(),
    sex: sexSchema,
    /**
     * @example
     * 'blass blau-graue Augen, sehr helle Haut, 174cm'
     */
    externalFeatures: z.string(),
});
export type BiometricInformation = z.infer<typeof biometricInformationSchema>;

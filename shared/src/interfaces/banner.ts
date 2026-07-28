import { z } from 'zod';

export const getBannerDataSchema = z
    .strictObject({
        type: z.enum([
            'primary',
            'secondary',
            'success',
            'danger',
            'warning',
            'info',
            'light',
            'dark',
        ]),
        message: z.string(),
    })
    .optional();
export type GetBannerData = z.infer<typeof getBannerDataSchema>;
export type GetBannerDataInput = z.input<typeof getBannerDataSchema>;

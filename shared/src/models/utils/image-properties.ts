import * as z from 'zod';

export const imagePropertiesSchema = z.strictObject({
    /**
     * A data URI or URL pointing to a local or remote image.
     *
     * Supported image types are: jpg, jpeg, png, svg. (Others are not tested)
     * @example '/assets/image.svg'
     */
    url: z.string(),
    /**
     * The height of the image in pixels at the {@link normalZoom}
     *
     * If there should be, e.g., children-patients and adult-patients they could share the same image, but with different heights.
     */
    height: z.int().positive(),
    /**
     * {@link aspectRatio} = width / {@link height}
     *
     * width = {@link aspectRatio} * {@link height}
     *
     * If the image is the same, their aspect ratios must be the same too.
     */
    aspectRatio: z.number().positive(),
});

export type ImageProperties = z.infer<typeof imagePropertiesSchema>;

export function newImageProperties(
    url: string,
    height: number,
    aspectRatio: number
): ImageProperties {
    return {
        url,
        height,
        aspectRatio,
    };
}

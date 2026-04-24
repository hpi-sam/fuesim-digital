import { z } from 'zod';
import { uuid, uuidSchema } from '../utils/uuid.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from './utils/image-properties.js';

export const mapImageTemplateSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('mapImageTemplate'),
    name: z.string(),
    image: imagePropertiesSchema,
});
export type MapImageTemplate = z.infer<typeof mapImageTemplateSchema>;

export function newMapImageTemplate(
    name: string,
    image: ImageProperties
): MapImageTemplate {
    return { id: uuid(), type: 'mapImageTemplate', name, image };
}

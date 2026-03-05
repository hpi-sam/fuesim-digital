import { z } from 'zod';
import { uuid } from '../utils/index.js';
import type { ImageProperties } from './utils/index.js';
import { imagePropertiesSchema } from './utils/index.js';

export const mapImageTemplateSchema = z.strictObject({
    id: z.uuidv4(),
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

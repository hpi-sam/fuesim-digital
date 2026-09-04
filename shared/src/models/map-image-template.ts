import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { versionedElementModelSchema } from '../marketplace/models/versioned-element-model.js';
import { validationMessages } from '../validation-messages.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from './utils/image-properties.js';

export const mapImageTemplateSchema = z.strictObject({
    ...versionedElementModelSchema.shape,
    id: uuidSchema,
    type: z.literal('mapImageTemplate'),
    name: z.string().trim().nonempty(validationMessages.required),
    image: imagePropertiesSchema,
});
export type MapImageTemplate = Immutable<
    z.infer<typeof mapImageTemplateSchema>
>;

export function newMapImageTemplate(
    name: string,
    image: ImageProperties
): MapImageTemplate {
    return { id: uuid(), type: 'mapImageTemplate', name, image };
}

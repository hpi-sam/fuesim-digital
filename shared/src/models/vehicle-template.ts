import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../utils/uuid.js';
import { versionedElementModel } from '../marketplace/models/versioned-element-model.js';
import { imagePropertiesSchema } from './utils/image-properties.js';
import { registerEditableValue } from './utils/editable-values-registry.js';
import { registerDependency } from './utils/dependency-registry.js';

export const vehicleTemplateSchema = z.strictObject({
    ...versionedElementModel.partial().shape,
    id: uuidSchema,
    type: z.literal('vehicleTemplate'),
    vehicleType: z.string(),
    name: z.string(),
    image: imagePropertiesSchema,
    patientCapacity: z.number(),
    personnelTemplateIds: z.array(uuidSchema),
    materialTemplateIds: z.array(uuidSchema),
});

registerEditableValue(
    {
        model: 'vehicle',
        template: 'vehicleTemplate',
    },
    [
        {
            id: 'name',
            name: 'Name',
            equality: ({ template, element }) => template.name === element.name,
            keep: ({ oldElement, newElement }) => ({
                ...newElement,
                name: oldElement.name,
            }),
        },
    ]
);

// We dont have any dependencies for the vehicle template YET!
registerDependency('vehicleTemplate', {
    detect: (content) => [],
    replace: (content, replacements) => content,
});

export type VehicleTemplate = Immutable<z.infer<typeof vehicleTemplateSchema>>;

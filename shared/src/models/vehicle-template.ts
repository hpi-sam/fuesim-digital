import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../utils/uuid.js';
import { versionedElementModelSchema } from '../marketplace/models/versioned-element-model.js';
import { hybridIdSchema } from '../utils/hybrid-id.js';
import { cloneDeepMutable } from '../utils/clone-deep.js';
import type { ElementVersionId } from '../marketplace/models/versioned-id-schema.js';
import { imagePropertiesSchema } from './utils/image-properties.js';
import { registerEditableValue } from './utils/editable-values-registry.js';
import { registerDependency } from './utils/dependency-registry.js';

export const vehicleTemplateSchema = z.strictObject({
    ...versionedElementModelSchema.partial().shape,
    id: uuidSchema,
    type: z.literal('vehicleTemplate'),
    vehicleType: z.string(),
    name: z.string(),
    image: imagePropertiesSchema,
    patientCapacity: z.number(),
    personnelTemplateIds: z.array(hybridIdSchema),
    materialTemplateIds: z.array(hybridIdSchema),
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
            asString: ({ template, element }) => ({
                template: template.name,
                model: element.name,
            }),
            equality: ({ template, element }) => template.name === element.name,
            keep: ({ oldElement, newElement }) => ({
                ...newElement,
                name: oldElement.name,
            }),
            replace: ({ newElement, newContent }) => ({
                ...newElement,
                name: newContent,
            }),
        },
    ]
);

export type VehicleTemplate = Immutable<z.infer<typeof vehicleTemplateSchema>>;

// We dont have any dependencies for the vehicle template YET!
registerDependency('vehicleTemplate', {
    detect: (content) => {
        const personnelTemplateIds = content.personnelTemplateIds;
        const materialTemplateIds = content.materialTemplateIds;
        return [
            ...personnelTemplateIds,
            ...materialTemplateIds,
        ] as ElementVersionId[];
    },
    replace: (content, replacements) => {
        const mutableContent = cloneDeepMutable(content);

        const replaceId = (id: string) => {
            const replacement = replacements.find((r) => r.old === id);
            return replacement ? replacement.new : id;
        };

        mutableContent.personnelTemplateIds =
            mutableContent.personnelTemplateIds
                .map(replaceId)
                .filter((f) => f !== null);
        mutableContent.materialTemplateIds = mutableContent.materialTemplateIds
            .map(replaceId)
            .filter((f) => f !== null);

        return mutableContent;
    },
});

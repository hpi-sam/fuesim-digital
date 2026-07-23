import { z } from 'zod';
import type { Immutable } from 'immer';
import { collectionElementTypeSchema } from './collection-element-type.js';
import type { Element as FuesimElement } from './../../models/element.js';
import {
    elementEntityIdSchema,
    elementVersionIdSchema,
} from './versioned-id-schema.js';

export const versionedElementModelSchema = z
    .strictObject({
        entity: z.object({
            entityId: elementEntityIdSchema,
            versionId: elementVersionIdSchema,
            type: collectionElementTypeSchema,
        }),
    })
    .partial();

const _nonOptionalEntitySchema =
    versionedElementModelSchema.shape.entity.nonoptional();
export type VersionedElementModel = {
    entity: z.infer<typeof _nonOptionalEntitySchema>;
};

export function getEntityFromElement(
    element: FuesimElement | Immutable<FuesimElement>
): VersionedElementModel['entity'] | undefined {
    if ('entity' in element) {
        const parsed = versionedElementModelSchema.shape.entity.safeParse(
            element.entity
        );
        if (!parsed.success || parsed.data === undefined) {
            return undefined;
        }

        return parsed.data;
    }
    return undefined;
}

export type StripEntityFromElementType<T extends object> = T & {
    entity?: undefined;
};
export function stripEntityFromElementSchema<T extends z.ZodObject>(
    schema: T
): z.ZodObject<
    T['shape'] & {
        entity: z.ZodOptional<z.ZodAny>;
    }
> {
    return z.object({
        ...schema.shape,
        entity: z.any().optional(),
    });
}

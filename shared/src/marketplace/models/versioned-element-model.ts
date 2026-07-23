import { z } from 'zod';
import type { Immutable } from 'immer';
import { collectionElementTypeSchema } from './collection-element-type.js';
import type { Element as FuesimElement } from './../../models/element.js';
import { contentlessTemplateVersionSchema } from './versioned-elements-contentless.js';

export const versionedElementModelSchema = z.strictObject({
    entity: z.object({
        ...contentlessTemplateVersionSchema.shape,
        type: collectionElementTypeSchema,
    }),
});

export const versionedElementModelStateExtension =
    versionedElementModelSchema.partial().shape;

export type VersionedElementModel = z.infer<typeof versionedElementModelSchema>;

export function getEntityFromElement(
    element: FuesimElement | Immutable<FuesimElement>
): VersionedElementModel['entity'] | undefined {
    if ('entity' in element) {
        const parsed = versionedElementModelStateExtension.entity.safeParse(
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

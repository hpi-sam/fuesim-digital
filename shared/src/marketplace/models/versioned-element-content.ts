import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { marketplaceElements } from '../elements/registry.js';
import { versionedElementModelSchema } from './versioned-element-model.js';
type MarketplaceElements = typeof marketplaceElements;
type TemplateSchema = MarketplaceElements[number]['templateSchema'];
const templateSchemas = marketplaceElements.map(
    (entry) => entry.templateSchema
) as [TemplateSchema, ...TemplateSchema[]];

export {
    type VersionedElementModel,
    versionedElementModelSchema,
} from './versioned-element-model.js';

export const templateVersionContentSchema = z.discriminatedUnion(
    'type',
    templateSchemas
);

export type TemplateVersionContent = Immutable<
    z.infer<typeof templateVersionContentSchema>
>;

export function isTemplateVersionContent(
    content: any
): content is WritableDraft<TemplateVersionContent> {
    return templateVersionContentSchema.safeParse(content).success;
}

export const definitelytemplateVersionContentSchema = z.union(
    // We want to enforce "entity" (from versionedElementModelSchema)
    // to be present in every option of templateVersionContentSchema
    templateVersionContentSchema.options.map((option) =>
        z.object({
            ...option.shape,
            ...versionedElementModelSchema.shape,
        })
    )
);

export type DefinitelyTemplateVersionContent = Immutable<
    z.infer<typeof definitelytemplateVersionContentSchema>
>;

import { z } from 'zod';

export const tagSchema = z.strictObject({
    category: z.string(),
    /**
     * The color of the tag.
     * This should be a valid value
     * for the css color property
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color}
     */
    backgroundColor: z.string(),
    /**
     * The text color of the tag.
     * This should be a valid value
     * for the css color property
     * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color}
     */
    color: z.string(),
    name: z.string(),
    specifier: z.string(),
});

export type Tag = z.infer<typeof tagSchema>;

/**
 * Please use a function from {@link ./utils/tag-helpers.ts} to create a tag for a specific category.
 */
export function newTag(
    category: string,
    backgroundColor: string,
    color: string,
    name: string,
    specifier: string
): Tag {
    return { category, backgroundColor, color, name, specifier };
}

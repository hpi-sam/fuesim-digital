import { z } from 'zod';

export function slugify(text: string) {
    return z.string().slugify().parse(text);
}

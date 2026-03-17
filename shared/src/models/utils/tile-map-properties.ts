/* eslint-disable require-unicode-regexp */
import { z } from 'zod';

export const tileUrlSchema = z.union([
    z.string().regex(/{x}/i),
    z.string().regex(/{(-)?y}/i),
    z.string().regex(/{z}/i),
]);
export const tileMapPropertiesSchema = z.strictObject({
    /**
     * The url to the server that serves the tiles. Must include {x}, {y} or {-y} and {z} placeholders.
     */
    tileUrl: tileUrlSchema,
    /**
     * The maximum {z} value the tile server accepts
     */
    maxZoom: z.number().positive(),
});
export type TileMapProperties = z.infer<typeof tileMapPropertiesSchema>;

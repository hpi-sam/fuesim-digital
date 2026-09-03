import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../utils/uuid.js';
import { versionedElementModelSchema } from '../marketplace/models/versioned-element-model.js';
import type { ElementEntityId } from '../marketplace/models/versioned-id-schema.js';

const base64ToBytes = z.codec(z.base64(), z.instanceof(Uint8Array), {
    decode: (base64String) => z.util.base64ToUint8Array(base64String),
    encode: (bytes) => z.util.uint8ArrayToBase64(bytes),
});

export const allowedImageFileTypes = [
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'image/webp',
];

export const uploadedImageSchema = z.strictObject({
    ...versionedElementModelSchema.shape,
    id: uuidSchema,
    type: z.literal('uploadedImage'),
    name: z.string().nonempty(),
    secret: z.string().nonempty(),
    aspectRatio: z.number().positive(),
});
export const uploadedImageUploadSchema = z.strictObject({
    ...versionedElementModelSchema.shape,
    id: uuidSchema,
    type: z.literal('uploadedImage'),
    name: z.string().nonempty(),
    file: base64ToBytes,
});
export type UploadedImageUpload = Immutable<
    z.infer<typeof uploadedImageUploadSchema>
>;
export type UploadedImageUploadInput = Immutable<
    z.output<typeof uploadedImageUploadSchema>
>;
export type UploadedImage = Immutable<z.infer<typeof uploadedImageSchema>>;

export function getKeyForUploadedImage(
    elementEntityId: ElementEntityId
): string {
    return `uploaded-image/${elementEntityId}`;
}

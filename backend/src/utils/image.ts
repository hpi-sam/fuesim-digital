import { allowedImageFileTypes } from 'fuesim-digital-shared';
import sharp, { type Sharp, type SharpInput } from 'sharp';

export class ImageValidationError extends Error {}

export async function validateImage(buffer: SharpInput) {
    let image: Sharp;
    try {
        image = sharp(buffer);
    } catch {
        throw new ImageValidationError('Das Bild ist kaputt.');
    }

    const metadata = await image.metadata();

    if (
        !metadata.mediaType ||
        !allowedImageFileTypes.includes(metadata.mediaType)
    ) {
        throw new ImageValidationError(
            `Das Bild hat einen ungültigen Dateityp: ${metadata.mediaType}. Die akzeptierten Dateitypen sind: ${allowedImageFileTypes.join(', ')}.`
        );
    }
    return { metadata, image };
}

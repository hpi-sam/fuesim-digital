import { allowedImageFileTypes } from 'fuesim-digital-shared';
import { type Sharp, type SharpInput } from 'sharp';
import bytes from 'bytes';
// eslint-disable-next-line import-x/no-named-as-default
import sharp from 'sharp';
import { Config } from '../config.js';

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

    if (!metadata.size || metadata.size > Config.imageUploadLimit) {
        throw new ImageValidationError(
            `Das Bild ist zu groß. Die maximal erlaubte Dateigröße beträgt ${bytes.format(Config.imageUploadLimit, { unitSeparator: ' ' })}.`
        );
    }
    return { metadata, image };
}

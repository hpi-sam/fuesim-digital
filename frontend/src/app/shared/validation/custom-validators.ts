import type { AbstractControl } from '@angular/forms';
import { z } from 'zod';
import { type SchemaPathTree, validateAsync } from '@angular/forms/signals';
import { resource } from '@angular/core';
import type { ImageProperties } from 'fuesim-digital-shared';
import { getImageAspectRatio } from '../functions/get-image-aspect-ratio.js';

export namespace CustomValidators {
    export function exactMatchValidator(stringToMatch: string) {
        return (control: AbstractControl) =>
            stringToMatch !== control.value
                ? { exactMatch: { value: control.value, stringToMatch } }
                : null;
    }
    export function urlValidator() {
        return (control: AbstractControl) =>
            !control.value || z.url().safeParse(control.value).success
                ? null
                : { url: true as const };
    }
    export function integerValidator() {
        return (control: AbstractControl) =>
            !control.value || Number.isInteger(control.value)
                ? null
                : { integer: true as const };
    }
}

export function validateImage(image: SchemaPathTree<ImageProperties>) {
    validateAsync(image.url, {
        params: ({ value }) => {
            const url = value();
            if (!z.url().safeParse(url).success) return undefined!;
            return url;
        },
        factory: (key) =>
            resource({
                params: key,
                loader: async ({ params }) => getImageAspectRatio(params),
            }),
        onSuccess: (result) => {
            console.log(result);
            return result
                ? null
                : {
                      kind: 'noImage',
                      message: 'Kein gültiges Bild gefunden',
                  };
        },
        onError: (error) => {
            console.log(error);
            return {
                kind: 'noImage',
                message: 'Kein gültiges Bild gefunden',
            };
        },
    });
}

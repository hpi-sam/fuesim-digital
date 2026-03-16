import { Directive } from '@angular/core';
import type { AbstractControl, AsyncValidator } from '@angular/forms';
import { NG_ASYNC_VALIDATORS } from '@angular/forms';
import { getImageAspectRatio } from '../functions/get-image-aspect-ratio';

@Directive({
    selector: '[appImageExistsValidator]',
    providers: [
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: ImageExistsValidatorDirective,
            multi: true,
        },
    ],
})
export class ImageExistsValidatorDirective implements AsyncValidator {
    async validate(
        control: AbstractControl
    ): Promise<ImageExistsValidatorError | null> {
        // We expect the image to not spontaneously being changing existence.
        return getImageAspectRatio(control.value)
            .then((aspectRatio) => null)
            .catch((error) => ({
                imageExists: {
                    url: control.value,
                    error,
                },
            }));
    }
}

export interface ImageExistsValidatorError {
    imageExists: {
        url: string;
        error: string;
    };
}

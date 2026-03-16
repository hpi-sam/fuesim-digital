import { Directive, inject } from '@angular/core';
import type { AbstractControl, AsyncValidator } from '@angular/forms';
import { NG_ASYNC_VALIDATORS } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Directive({
    selector: '[appExerciseExistsValidator]',
    providers: [
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: ExerciseExistsValidatorDirective,
            multi: true,
        },
    ],
})
export class ExerciseExistsValidatorDirective implements AsyncValidator {
    private readonly apiService = inject(ApiService);

    async validate(
        control: AbstractControl
    ): Promise<ExerciseExistsValidatorError | null> {
        // Because the ids are randomly generated, we can expect the exerciseId
        // to not become valid without the user typing a new id.
        try {
            await this.apiService.exerciseExists(control.value);
            return null;
        } catch {
            return {
                exerciseDoesNotExist: {
                    id: control.value,
                },
            };
        }
    }
}

export interface ExerciseExistsValidatorError {
    exerciseDoesNotExist: {
        id: number;
    };
}

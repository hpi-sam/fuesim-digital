import { Directive } from '@angular/core';
import type { AbstractControl, AsyncValidator } from '@angular/forms';
import { NG_ASYNC_VALIDATORS } from '@angular/forms';
import { ApiService } from 'src/app/core/api.service';

@Directive({
    selector: '[appExerciseExistsValidator]',
    providers: [
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: ExerciseExistsValidatorDirective,
            multi: true,
        },
    ],
    standalone: false,
})
export class ExerciseExistsValidatorDirective implements AsyncValidator {
    constructor(private readonly apiService: ApiService) {}

    async validate(
        control: AbstractControl
    ): Promise<ExerciseExistsValidatorError | null> {
        // Because the ids are randomly generated, we can expect the exerciseId
        // to not become valid without the user typing a new id.
        return this.apiService.exerciseExists(control.value).then((exists) =>
            exists
                ? null
                : {
                      exerciseExists: {
                          id: control.value,
                      },
                  }
        );
    }
}

export interface ExerciseExistsValidatorError {
    exerciseExists: {
        id: number;
    };
}

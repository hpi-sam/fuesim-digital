import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { ColorCode } from 'fuesim-digital-shared';

const colorCodeMap = {
    V: 'black',
    W: 'blue',
    X: 'green',
    Y: 'yellow',
    Z: 'red',
} as const satisfies { readonly [Key in ColorCode]: string };

@Pipe({ name: 'patientStatusColor' })
export class PatientStatusColorPipe implements PipeTransform {
    transform(value: ColorCode) {
        return colorCodeMap[value];
    }
}

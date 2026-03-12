import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { TreatmentProgress } from 'fuesim-digital-shared';
import { treatmentProgressToGermanNameDictionary } from 'fuesim-digital-shared';

@Pipe({ name: 'treatmentProgressToGermanName' })
export class TreatmentProgressToGermanNamePipe implements PipeTransform {
    transform(value: TreatmentProgress): string {
        return treatmentProgressToGermanNameDictionary[value];
    }
}

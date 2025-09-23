import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { TreatmentProgress } from 'digital-fuesim-manv-shared';
import { treatmentProgressToGermanNameDictionary } from 'digital-fuesim-manv-shared';

@Pipe({
    name: 'treatmentProgressToGermanName',
    standalone: false,
})
export class TreatmentProgressToGermanNamePipe implements PipeTransform {
    transform(value: TreatmentProgress): string {
        return treatmentProgressToGermanNameDictionary[value];
    }
}

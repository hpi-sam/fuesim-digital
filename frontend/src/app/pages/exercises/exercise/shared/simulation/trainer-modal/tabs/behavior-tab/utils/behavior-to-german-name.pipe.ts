import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { ExerciseSimulationBehaviorType } from 'digital-fuesim-manv-shared';
import { behaviorTypeToGermanNameDictionary } from 'digital-fuesim-manv-shared';

@Pipe({
    name: 'behaviorTypeToGermanName',
    standalone: false,
})
export class BehaviorTypeToGermanNamePipe implements PipeTransform {
    transform(value: ExerciseSimulationBehaviorType): string {
        return behaviorTypeToGermanNameDictionary[value];
    }
}

import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { ExerciseSimulationBehaviorType } from 'fuesim-digital-shared';
import { behaviorTypeToGermanNameDictionary } from 'fuesim-digital-shared';

@Pipe({ name: 'behaviorTypeToGermanName' })
export class BehaviorTypeToGermanNamePipe implements PipeTransform {
    transform(value: ExerciseSimulationBehaviorType): string {
        return behaviorTypeToGermanNameDictionary[value];
    }
}

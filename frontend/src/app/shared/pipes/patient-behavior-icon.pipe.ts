import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { BehaviourCode } from 'fuesim-digital-shared';

const behaviorIconMap: { [Key in BehaviourCode]: string } = {
    A: 'bi-arrow-right-square-fill',
    B: 'bi-heartbreak-fill',
    C: 'bi-signpost-fill',
    D: 'bi-exclamation-triangle-fill',
    E: 'bi-x-circle-fill',
};

@Pipe({ name: 'patientBehaviorIcon' })
export class PatientBehaviorIconPipe implements PipeTransform {
    transform(value: BehaviourCode): string {
        return behaviorIconMap[value];
    }
}

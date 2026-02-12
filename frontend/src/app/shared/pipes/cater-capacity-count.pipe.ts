import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { CanCaterFor } from 'fuesim-digital-shared';

@Pipe({
    name: 'caterCapacityCount',
    standalone: false,
})
export class CaterCapacityCountPipe implements PipeTransform {
    transform(canCaterFor: CanCaterFor): number {
        return canCaterFor.red + canCaterFor.yellow + canCaterFor.green;
    }
}

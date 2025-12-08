import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

@Pipe({
    name: 'times',
    standalone: false,
})
export class TimesPipe implements PipeTransform {
    /**
     * @param object The **immutable** object to get the values from
     * @returns an array of the values in the object in their original order
     */
    // Accepts undefined and null too, to make it easier to use in templates with e.g. | async
    transform(object: number): number[] {
        return Array(object);
    }
}

import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

@Pipe({
    name: 'times',
    standalone: false,
})
export class TimesPipe implements PipeTransform {
    // Returns array with n elements
    transform(object: number): number[] {
        return Array(object);
    }
}

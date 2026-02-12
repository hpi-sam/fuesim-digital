import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import { formatDuration } from 'fuesim-digital-shared';

@Pipe({
    name: 'formatDuration',
    standalone: false,
})
export class FormatDurationPipe implements PipeTransform {
    /**
     *
     * @param duration in ms
     */
    transform(duration: number): string {
        return formatDuration(duration);
    }
}

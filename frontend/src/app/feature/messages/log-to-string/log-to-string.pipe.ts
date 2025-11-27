import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import { logToStringPipeTransform } from './log-to-string-pipe-transform';

@Pipe({
    name: 'logToString',
    standalone: false,
})
export class LogToStringPipe implements PipeTransform {
    transform = logToStringPipeTransform;
}

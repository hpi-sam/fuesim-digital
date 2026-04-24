import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type { PatientCategory } from '../simulated-region-overview-general-tab.component';

@Pipe({ name: 'withDollar' })
export class WithDollarPipe implements PipeTransform {
    transform<Category extends PatientCategory>(
        value: Category
    ): `${Category}$` {
        return `${value}$`;
    }
}

import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import type {
    PatientCategory,
    PersonnelCategory,
} from '../simulated-region-overview-general-tab.component';

@Pipe({
    name: 'withDollar',
    standalone: false,
})
export class WithDollarPipe implements PipeTransform {
    transform<Category extends PatientCategory | PersonnelCategory>(
        value: Category
    ): `${Category}$` {
        return `${value}$`;
    }
}

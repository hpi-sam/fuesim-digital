import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import { ClientRole, type SpecificRole } from 'fuesim-digital-shared';

@Pipe({ name: 'specificRoleDisplayName' })
export class SpecificRoleDisplayNamePipe implements PipeTransform {
    transform(specificRole: SpecificRole | undefined): string {
        if (!specificRole) return '';

        return ClientRole.getSpecificRoleDisplayName(specificRole);
    }
}

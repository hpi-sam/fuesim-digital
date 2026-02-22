import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import {
    getSpecificRoleDisplayName,
    getVersionedElementTypeDisplayName,
    VersionedElementContent,
    type SpecificRole,
} from 'fuesim-digital-shared';

@Pipe({ name: 'versionedElementDisplayName' })
export class VersionedElementDisplayNamePipe implements PipeTransform {
    transform(element: VersionedElementContent['type']): {
        singular: string;
        plural: string;
    } {
        if (!element) return { singular: '', plural: '' };

        return getVersionedElementTypeDisplayName(element);
    }
}

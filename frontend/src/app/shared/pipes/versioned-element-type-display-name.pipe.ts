import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import {
    getVersionedElementTypeDisplayName,
    VersionedElementContent,
} from 'fuesim-digital-shared';

@Pipe({ name: 'versionedElementDisplayName' })
export class VersionedElementDisplayNamePipe implements PipeTransform {
    transform(element: VersionedElementContent['type']): {
        singular: string;
        plural: string;
    } {
        return getVersionedElementTypeDisplayName(element);
    }
}

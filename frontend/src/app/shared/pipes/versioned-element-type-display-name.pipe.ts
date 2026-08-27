import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import {
    getMarketplaceElementByType,
    MarketplaceElementContent,
} from 'fuesim-digital-shared';

@Pipe({ name: 'versionedElementDisplayName' })
export class VersionedElementDisplayNamePipe implements PipeTransform {
    transform(element: MarketplaceElementContent['type']):
        | {
              singular: string;
              plural: string;
          }
        | undefined {
        return getMarketplaceElementByType(element).naming;
    }
}

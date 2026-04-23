import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import {
    CollectionRelationshipType,
    collectionRelationshipTypesDisplayNames,
} from 'fuesim-digital-shared';

@Pipe({ name: 'collectionRelationshipType' })
export class CollectionRelationshipTypeDisplayNamePipe
    implements PipeTransform
{
    transform(relationshipType: CollectionRelationshipType): string {
        return collectionRelationshipTypesDisplayNames[relationshipType];
    }
}

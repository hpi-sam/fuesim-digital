import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import {
    CollectionOrganisationRelationshipType,
    collectionOrganisationRelationshipTypeDisplayNames,
} from 'fuesim-digital-shared';

@Pipe({ name: 'collectionRelationshipType' })
export class CollectionRelationshipTypeDisplayNamePipe implements PipeTransform {
    transform(
        relationshipType: CollectionOrganisationRelationshipType
    ): string {
        return collectionOrganisationRelationshipTypeDisplayNames[
            relationshipType
        ];
    }
}

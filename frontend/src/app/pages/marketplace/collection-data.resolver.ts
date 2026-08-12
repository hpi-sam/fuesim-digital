import { inject } from '@angular/core';
import type { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { Router } from '@angular/router';
import type { CollectionEntityId } from 'fuesim-digital-shared';
import { isCollectionEntityId } from 'fuesim-digital-shared';
import type { BehaviorSubject } from 'rxjs';
import type { CollectionSubscriptionData } from '../../core/collection.service';
import { CollectionService } from '../../core/collection.service';

export interface CollectionDataResolverResult {
    subject: BehaviorSubject<CollectionSubscriptionData | null>;
    collectionEntityId: CollectionEntityId;
}

export const collectionDataResolver: ResolveFn<
    CollectionDataResolverResult
> = async (route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const collectionService = inject(CollectionService);
    const collectionEntityId = route.paramMap.get('collectionEntityId') ?? '';

    if (!isCollectionEntityId(collectionEntityId)) {
        router.navigate(['/collections']);
        throw new Error('Invalid collection entity id');
    }

    const collectionSubject =
        await collectionService.subscribeToCollection(collectionEntityId);

    return {
        subject: collectionSubject,
        collectionEntityId,
    };
};

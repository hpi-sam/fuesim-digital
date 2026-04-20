import { inject } from '@angular/core';
import type {
    ActivatedRouteSnapshot,
    ResolveFn} from '@angular/router';
import {
    
    Router,
} from '@angular/router';
import type {
    CollectionEntityId} from 'fuesim-digital-shared';
import {
    isCollectionEntityId,
} from 'fuesim-digital-shared';
import type { BehaviorSubject} from 'rxjs';
import type {
    CollectionSubscriptionData} from '../../core/exercise-element.service';
import {
    CollectionService
} from '../../core/exercise-element.service';

export interface CollectionDataResolverResult {
    subject: BehaviorSubject<CollectionSubscriptionData | null>;
    collectionEntityId: CollectionEntityId;
}

export const collectionDataResolver: ResolveFn<CollectionDataResolverResult> = (
    route: ActivatedRouteSnapshot
) => {
    const router = inject(Router);
    const collectionService = inject(CollectionService);

    console.log('Resolving collection data for route', route);
    const collectionEntityId = route.paramMap.get('collectionEntityId') ?? '';

    if (!isCollectionEntityId(collectionEntityId)) {
        router.navigate(['/collections']);
        throw new Error('Invalid collection entity id');
    }

    const collectionSubject =
        collectionService.subscribeToCollection(collectionEntityId);
    console.log('got resolver', collectionSubject);

    return {
        subject: collectionSubject,
        collectionEntityId,
    };
};

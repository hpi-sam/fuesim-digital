import { inject, Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Resolve,
    ResolveFn,
    Router,
} from '@angular/router';
import { CollectionEntityId, isCollectionEntityId } from 'fuesim-digital-shared';
import {
    CollectionService,
    CollectionSubscriptionData,
} from '../../core/exercise-element.service';
import { BehaviorSubject, Observable } from 'rxjs';

export type CollectionDataResolverResult = {
    subject: BehaviorSubject<CollectionSubscriptionData | null>,
    collectionEntityId: CollectionEntityId
}

export const collectionDataResolver: ResolveFn<CollectionDataResolverResult> = (route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const collectionService = inject(CollectionService);

    console.log('Resolving collection data for route', route);
    const collectionEntityId = route.paramMap.get('collectionEntityId') ?? '';

    if (!isCollectionEntityId(collectionEntityId)) {
        router.navigate(['/collections']);
        console.log('FUCK');
        throw new Error('Invalid collection entity id');
    }

    const collectionSubject =
        collectionService.subscribeToCollection(collectionEntityId);
    console.log('got resolver', collectionSubject);

    return {
        subject: collectionSubject,
        collectionEntityId
    };
};

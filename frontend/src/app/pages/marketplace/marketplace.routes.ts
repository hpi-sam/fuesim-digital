import type { Routes } from '@angular/router';
import { IsAuthenticatedGuard } from '../guards/is-authenticated.guard';
import { MarketplaceLayoutComponent } from './marketplace-layout/marketplace-layout.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { MarketplaceSetDetailComponent } from './collection-detail-view/collection-detail-view.component';
import { MarketplaceArchiveComponent } from './marketplace-archive/marketplace-archive.component';
import { collectionDataResolver } from './collection-data.resolver';
import { ViewCollectionGuard } from './guards/view-collection-guard';
import { LeaveDraftCollectionGuard } from './guards/can-leave-draft-collection.guard';

export const routes: Routes = [
    {
        path: '',
        component: MarketplaceLayoutComponent,
        children: [
            {
                path: '',
                component: MarketplaceComponent,
            },
            {
                path: 'archive',
                component: MarketplaceArchiveComponent,
                canActivate: [IsAuthenticatedGuard],
            },
            {
                path: ':collectionEntityId',
                component: MarketplaceSetDetailComponent,
                canActivate: [ViewCollectionGuard],
                canDeactivate: [LeaveDraftCollectionGuard],
                resolve: {
                    collectionSubscription: collectionDataResolver,
                },
            },
        ],
    },
];

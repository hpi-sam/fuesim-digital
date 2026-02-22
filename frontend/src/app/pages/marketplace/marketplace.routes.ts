import type { Routes } from '@angular/router';
import { MarketplaceLayoutComponent } from './marketplace-layout/marketplace-layout.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { MarketplaceSetDetailComponent } from './collection-detail-view/collection-detail-view.component';
import { JoinCollectionGuard } from './join-collection.guard';
import { MarketplaceArchiveComponent } from './marketplace-archive/marketplace-archive.component';
import { collectionDataResolver } from './collection-data.resolver';

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
            },
            {
                path: ':collectionEntityId',
                component: MarketplaceSetDetailComponent,
                canActivate: [JoinCollectionGuard],
                resolve: {
                    collectionSubscription: collectionDataResolver,
                },
            },
        ],
    },
];

import type { Routes } from '@angular/router';
import { MarketplaceLayoutComponent } from './marketplace-layout/marketplace-layout.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { MarketplaceSetDetailComponent } from './marketplace-set-detail/marketplace-set-detail.component';
import { JoinCollectionGuard } from './join-collection.guard';
import { MarketplaceArchiveComponent } from './marketplace-archive/marketplace-archive.component';
import { IsAuthenticatedGuard } from '../exercises/guards/is-authenticated.guard';

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
            },
        ],
    },
];

import { NgModule } from '@angular/core';
import type { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MarketplaceLayoutComponent } from './marketplace-layout/marketplace-layout.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { MarketplaceSetDetailComponent } from './marketplace-set-detail/marketplace-set-detail.component';

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
                path: ':setEntityId',
                component: MarketplaceSetDetailComponent,
            },
        ],
    },
];

import { NgModule } from '@angular/core';
import type { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ImprintComponent } from './imprint/imprint.component.js';
import { LicenseComponent } from './license/license.component.js';
import { PrivacyComponent } from './privacy/privacy.component.js';
import { TermsComponent } from './terms/terms.component.js';

const routes: Routes = [
    {
        path: 'imprint',
        component: ImprintComponent,
    },
    {
        path: 'terms',
        component: TermsComponent,
    },
    {
        path: 'license',
        component: LicenseComponent,
    },
    {
        path: 'privacy',
        component: PrivacyComponent,
    },
    {
        path: '',
        redirectTo: 'imprint',
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AboutRoutingModule {}

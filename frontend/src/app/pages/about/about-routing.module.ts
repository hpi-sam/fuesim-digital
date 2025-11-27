import { NgModule } from '@angular/core';
import type { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ImprintComponent } from './imprint/imprint.component';
import { LicenseComponent } from './license/license.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { TermsComponent } from './terms/terms.component';

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

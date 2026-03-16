import type { Routes } from '@angular/router';
import { ImprintComponent } from './imprint/imprint.component';
import { LicenseComponent } from './license/license.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { TermsComponent } from './terms/terms.component';

export const aboutRoutes: Routes = [
    { path: 'imprint', component: ImprintComponent },
    { path: 'terms', component: TermsComponent },
    { path: 'license', component: LicenseComponent },
    { path: 'privacy', component: PrivacyComponent },
    { path: '', redirectTo: 'imprint', pathMatch: 'full' },
];

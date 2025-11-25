import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from 'src/app/shared/shared.module.js';
import { AboutRoutingModule } from './about-routing.module.js';
import { ImprintComponent } from './imprint/imprint.component.js';
import { PrivacyComponent } from './privacy/privacy.component.js';
import { LicenseComponent } from './license/license.component.js';
import { TermsComponent } from './terms/terms.component.js';
import { AboutPlaceholderComponent } from './about-placeholder/about-placeholder.component.js';

@NgModule({
    declarations: [
        ImprintComponent,
        TermsComponent,
        PrivacyComponent,
        LicenseComponent,
        AboutPlaceholderComponent,
    ],
    imports: [CommonModule, AboutRoutingModule, SharedModule],
})
export class AboutModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';
import { AboutRoutingModule } from './about-routing.module';
import { ImprintComponent } from './imprint/imprint.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { LicenseComponent } from './license/license.component';
import { TermsComponent } from './terms/terms.component';
import { AboutPlaceholderComponent } from './about-placeholder/about-placeholder.component';

@NgModule({
    imports: [
        CommonModule,
        AboutRoutingModule,
        SharedModule,
        ImprintComponent,
        TermsComponent,
        PrivacyComponent,
        LicenseComponent,
        AboutPlaceholderComponent,
    ],
})
export class AboutModule {}

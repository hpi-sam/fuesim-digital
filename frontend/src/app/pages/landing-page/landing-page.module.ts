import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LandingPageComponent } from './landing-page/landing-page.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        RouterLink,
        LandingPageComponent,
    ],
    exports: [LandingPageComponent],
})
export class LandingPageModule {}

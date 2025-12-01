import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { Error404Component } from './error-404.component';

@NgModule({
    imports: [CommonModule, RouterModule, SharedModule],
    declarations: [Error404Component],
    exports: [Error404Component],
})
export class Error404Module {}

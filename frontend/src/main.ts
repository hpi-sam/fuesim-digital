/// <reference types="@angular/localize" />

import { enableProdMode, importProvidersFrom } from '@angular/core';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { AppRoutingModule } from './app/app-routing.module';
import {
    withCredentialsInterceptor,
    errorHandlingInterceptor,
} from './app/shared/functions/http';
import { environment } from './environments/environment';
import type { AppState } from './app/state/app.state';
import { appReducers } from './app/state/app.reducer';
import { LandingPageModule } from './app/pages/landing-page/landing-page.module';
import { Error404Module } from './app/pages/error-404/error-404.module';
import { SharedModule } from './app/shared/shared.module';
import { ConfirmationModalModule } from './app/core/confirmation-modal/confirmation-modal.module';
import { MessagesModule } from './app/feature/messages/messages.module';
import { AboutModule } from './app/pages/about/about.module';
import { AppComponent } from './app/app.component';

if (environment.production) {
    enableProdMode();
    // WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
    // Use `as any` as node typings are not available here
    (window as any).process = {
        ...(window as any).process,
        env: {
            ...((window as any).process?.env ?? {}),
            NODE_ENV: 'production',
        },
    };
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(
            CommonModule,
            BrowserModule,
            BrowserAnimationsModule,
            AppRoutingModule,
            StoreModule.forRoot<AppState>(appReducers),
            LandingPageModule,
            Error404Module,
            SharedModule,
            ConfirmationModalModule,
            MessagesModule,
            AboutModule
        ),
        provideHttpClient(
            withInterceptors([
                withCredentialsInterceptor,
                errorHandlingInterceptor,
            ])
        ),
    ],
}).catch((err) => console.error(err));

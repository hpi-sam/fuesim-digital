/// <reference types="@angular/localize" />

import {
    enableProdMode,
    importProvidersFrom,
    inject,
    provideAppInitializer,
} from '@angular/core';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import {
    withCredentialsInterceptor,
    errorHandlingInterceptor,
} from './app/shared/functions/http';
import { environment } from './environments/environment';
import type { AppState } from './app/state/app.state';
import { appReducers } from './app/state/app.reducer';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { AuthService } from './app/core/auth.service';

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
        provideRouter(appRoutes),
        importProvidersFrom(
            CommonModule,
            BrowserModule,
            BrowserAnimationsModule,
            StoreModule.forRoot<AppState>(appReducers)
        ),
        provideHttpClient(
            withInterceptors([
                withCredentialsInterceptor,
                errorHandlingInterceptor,
            ])
        ),
        // Returns promise to block application loading until AuthService is initialized
        provideAppInitializer(
            async (): Promise<void> => inject(AuthService).initialize()
        ),
    ],
}).catch((err) => console.error(err));

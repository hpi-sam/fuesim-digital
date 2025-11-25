import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { AppRoutingModule } from './app-routing.module.js';
import { AppComponent } from './app.component.js';
import { ConfirmationModalModule } from './core/confirmation-modal/confirmation-modal.module.js';
import { MessagesModule } from './feature/messages/messages.module.js';
import { Error404Module } from './pages/error-404/error-404.module.js';
import { HealthPageComponent } from './pages/health/health-page/health-page.component.js';
import { LandingPageModule } from './pages/landing-page/landing-page.module.js';
import { SharedModule } from './shared/shared.module.js';
import { appReducers } from './state/app.reducer.js';
import type { AppState } from './state/app.state.js';
import { AboutModule } from './pages/about/about.module.js';

@NgModule({
    declarations: [AppComponent, HealthPageComponent],
    bootstrap: [AppComponent],
    imports: [
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
        AboutModule,
    ],
    providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class AppModule {}

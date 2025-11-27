import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfirmationModalModule } from './core/confirmation-modal/confirmation-modal.module';
import { MessagesModule } from './feature/messages/messages.module';
import { Error404Module } from './pages/error-404/error-404.module';
import { HealthPageComponent } from './pages/health/health-page/health-page.component';
import { LandingPageModule } from './pages/landing-page/landing-page.module';
import { SharedModule } from './shared/shared.module';
import { appReducers } from './state/app.reducer';
import type { AppState } from './state/app.state';
import { AboutModule } from './pages/about/about.module';

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

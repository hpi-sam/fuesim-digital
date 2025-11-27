/// <reference types="@angular/localize" />

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

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

platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));

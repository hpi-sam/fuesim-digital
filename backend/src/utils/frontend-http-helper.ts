import type { AuthQueryParams } from 'fuesim-digital-shared';
import { Config } from '../config.js';

export function toFrontend(path: string = '', data?: AuthQueryParams): string {
    const url = new URL(Config.httpFrontendUrl + path);
    if (data?.logoutStatus) {
        url.searchParams.append('logoutStatus', data.logoutStatus);
    }
    if (data?.loginFailure) {
        url.searchParams.append('loginFailure', data.loginFailure);
    }
    if (data?.loginSuccess) {
        url.searchParams.append('loginSuccess', 'true');
    }
    return url.toString();
}

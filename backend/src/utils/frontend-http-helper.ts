import type { AuthQueryParams } from 'digital-fuesim-manv-shared';
import { Config } from '../config.js';

export function toFrontend(path: string = '', data?: AuthQueryParams): string {
    const url = new URL(Config.httpFrontendUrl + path);
    if (data?.logoutstatus) {
        url.searchParams.append('logoutstatus', data.logoutstatus);
    }
    if (data?.loginfailure) {
        url.searchParams.append('loginfailure', data.loginfailure);
    }
    if(data?.loginsuccess) {
        url.searchParams.append('loginsuccess', 'true');
    }
    return url.toString();
}

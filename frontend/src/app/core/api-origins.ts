import { environment } from 'src/environments/environment';

const isSecureProtocol = window.location.protocol === 'https:';

export const websocketOrigin = `${isSecureProtocol ? 'wss' : 'ws'}://${
    window.location.hostname
}:${environment.websocketPort}`;

export const httpOrigin = `${isSecureProtocol ? 'https' : 'http'}://${
    window.location.hostname
}:${environment.httpPort}`;

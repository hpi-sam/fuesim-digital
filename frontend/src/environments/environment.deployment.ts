import type { Environment } from './environment-type';

export const environment: Environment = {
    production: true,
    httpPort:
        Number.parseInt(window.location.port) ||
        (window.location.protocol === 'https:' ? 443 : 80),
    websocketPort:
        Number.parseInt(window.location.port) ||
        (window.location.protocol === 'https:' ? 443 : 80),
};

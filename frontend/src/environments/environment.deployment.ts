import type { Environment } from './environment-type';

export const environment: Environment = {
    production: true,
    httpPort:
        Number.parseInt(window.location.port, 10) ||
        (window.location.protocol === 'https:' ? 443 : 80),
    websocketPort:
        Number.parseInt(window.location.port, 10) ||
        (window.location.protocol === 'https:' ? 443 : 80),
    docsUrl: '/about/help',
};

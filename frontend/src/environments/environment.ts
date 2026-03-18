import type { Environment } from './environment-type';

export const environment: Environment = {
    production: false,
    httpPort: 3201,
    websocketPort: 3200,
    docsUrl: 'http://localhost:3000',
};

// to ignore zone related error stack frames such as `zone.run` and `zoneDelegate.invokeTask`.
import 'zone.js/plugins/zone-error';

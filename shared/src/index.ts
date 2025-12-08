// this import is needed for `import { Type } from 'class-transformer';` to work
import 'reflect-metadata';

// This environment is set at the backend and (manually) on the frontend, therefore we can use it in here
declare global {
    const process: {
        env: {
            NODE_ENV:
                | string
                | 'development'
                | 'production'
                | 'staging'
                | 'testing';
        };
    };
}

export * from './export-import/file-format/index.js';
export * from './models/index.js';
export * from './models/utils/index.js';
export * from './models/radiogram/index.js';
export * from './models/utils/role.js';
export * from './utils/index.js';
export * from './simulation/index.js';
export * from './state.js';
export * from './store/index.js';
export * from './socket-api/index.js';
export * from './http-interfaces.js';
export * from './state-helpers/index.js';
export * from './data/index.js';
export * from './store/action-reducers/utils/index.js';
export * from './state-migrations/index.js';

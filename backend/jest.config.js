import baseConfig from '../jest.base.config.js';

export default {
    ...baseConfig,
    displayName: 'Backend',
    collectCoverageFrom: ['./src/**/*.ts'],
    coveragePathIgnorePatterns: [
        './src/index.ts',
        './src/database/migration-datasource.ts',
        './src/database/data-source.ts',
        './src/database/migrations/*',
    ],
};

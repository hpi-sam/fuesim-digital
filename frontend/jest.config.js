import baseConfig from '../jest.base.config.js';

export default {
    ...baseConfig,
    displayName: 'Frontend',
    testPathIgnorePatterns: ['<rootDir>/cypress/'],
};

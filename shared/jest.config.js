import baseConfig from '../jest.base.config.js';

export default {
    ...baseConfig,
    displayName: 'Shared',
    // See here: https://github.com/nestjs/nest/issues/1305#issuecomment-488337778
    setupFiles: ['./src/index.ts'],
    setupFilesAfterEnv: ['jest-extended/all'],
    testPathIgnorePatterns: ['./tests/utils'],
};

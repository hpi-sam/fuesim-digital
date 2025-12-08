/**
 * These are the default settings for all Jest tests, that can be overwritten in individual configs.
 *
 * Everything related to the code coverage has to be specified in the global config. https://github.com/facebook/jest/issues/4255#issuecomment-321939025
 */
export default {
    moduleFileExtensions: ['js', 'json', 'ts'],
    // See https://kulshekhar.github.io/ts-jest/docs/next/guides/esm-support/
    // and https://jestjs.io/docs/ecmascript-modules
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '\\.ts$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    moduleDirectories: ['node_modules', 'src'],
    testEnvironment: 'node',
    testRegex: '\\.spec\\.ts$',
    // For the time being, as tests are split up in `npm run test`, the coverage should reside here.
    coverageReporters: ['text', 'text-summary', 'json', 'lcov', 'cobertura'],
};

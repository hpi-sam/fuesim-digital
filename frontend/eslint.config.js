import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import { includeIgnoreFile } from '@eslint/compat';
import _import from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import ts from 'typescript-eslint';
import js from '@eslint/js';
import rxjsX from 'eslint-plugin-rxjs-x';
import rxjsAngularX from 'eslint-plugin-rxjs-angular-x';
import angular from 'angular-eslint';
import sharedAngularTemplate from '../.eslint/angular-template.eslintrc.mjs';
import sharedAngularTypescript from '../.eslint/angular-typescript.eslintrc.mjs';
import sharedTypescript from '../.eslint/typescript.eslintrc.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default defineConfig([
    globalIgnores(['**/index.html', '**/assets/about/*.html']),
    includeIgnoreFile(gitignorePath),
    {
        files: ['**/*.ts', '**/*.js'],

        ignores: ['cypress.config.ts'],

        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        extends: [
            js.configs.recommended,
            ts.configs.recommended,
            _import.flatConfigs.recommended,
            _import.flatConfigs.typescript,
            ...angular.configs.tsRecommended,
            rxjsX.configs.recommended,
            sharedAngularTypescript,
            sharedTypescript,
        ],

        plugins: {
            unicorn,
            'rxjs-angular-x': rxjsAngularX,
        },

        processor: angular.processInlineTemplates,
    },
    {
        files: ['**/*.js', 'cypress.config.ts'],

        extends: [ts.configs.disableTypeChecked],

        // Manually disable all rxjs-x and rxjs-angular-x rules that need type information
        rules: {
            'rxjs-x/ban-operators': 'off',
            'rxjs-x/finnish': 'off',
            'rxjs-x/no-async-subscribe': 'off',
            'rxjs-x/no-connectable': 'off',
            'rxjs-x/no-create': 'off',
            'rxjs-x/no-cyclic-action': 'off',
            'rxjs-x/no-exposed-subjects': 'off',
            'rxjs-x/no-finnish': 'off',
            'rxjs-x/no-floating-observables': 'off',
            'rxjs-x/no-ignored-default-value': 'off',
            'rxjs-x/no-ignored-error': 'off',
            'rxjs-x/no-ignored-notifier': 'off',
            'rxjs-x/no-ignored-subscribe': 'off',
            'rxjs-x/no-ignored-subscription': 'off',
            'rxjs-x/no-implicit-any-catch': 'off',
            'rxjs-x/no-misused-observables': 'off',
            'rxjs-x/no-nested-subscribe': 'off',
            'rxjs-x/no-redundant-notify': 'off',
            'rxjs-x/no-subclass': 'off',
            'rxjs-x/no-subject-unsubscribe': 'off',
            'rxjs-x/no-subject-value': 'off',
            'rxjs-x/no-subscribe-handlers': 'off',
            'rxjs-x/no-subscribe-in-pipe': 'off',
            'rxjs-x/no-topromise': 'off',
            'rxjs-x/no-unbound-methods': 'off',
            'rxjs-x/no-unsafe-catch': 'off',
            'rxjs-x/no-unsafe-first': 'off',
            'rxjs-x/no-unsafe-subject-next': 'off',
            'rxjs-x/no-unsafe-switchmap': 'off',
            'rxjs-x/no-unsafe-takeuntil': 'off',
            'rxjs-x/prefer-observer': 'off',
            'rxjs-x/suffix-subjects': 'off',
            'rxjs-x/throw-error': 'off',
            'rxjs-angular-x/prefer-async-pipe': 'off',
            'rxjs-angular-x/prefer-composition': 'off',
            'rxjs-angular-x/prefer-takeuntil': 'off',
        },
    },
    {
        files: ['**/*.component.html'],

        extends: [
            ...angular.configs.templateRecommended,
            sharedAngularTemplate,
        ],
    },
    prettier,
]);

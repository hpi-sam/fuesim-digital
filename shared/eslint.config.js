import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import { includeIgnoreFile } from '@eslint/compat';
import _import from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import ts from 'typescript-eslint';
import js from '@eslint/js';
import sharedTypescript from '../.eslint/typescript.eslintrc.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default defineConfig([
    includeIgnoreFile(gitignorePath),
    {
        files: ['**/*.ts', '**/*.js'],

        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
        },

        extends: [
            js.configs.recommended,
            ts.configs.recommended,
            _import.flatConfigs.recommended,
            _import.flatConfigs.typescript,
            sharedTypescript,
        ],

        plugins: {
            unicorn,
        },

        rules: {
            // TODO: Temporarily disabled, see #1121
            '@typescript-eslint/explicit-member-accessibility': 'off',
        },
    },
    {
        files: ['!**/index.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/*/index.js'],
                            message: 'Please use specific import paths.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['**/*.js'],

        extends: [ts.configs.disableTypeChecked],
    },
    prettier,
]);

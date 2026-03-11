export default {
    rules: {
        /**
         * @angular-eslint
         */
        '@angular-eslint/directive-selector': [
            'warn',
            {
                type: 'attribute',
                prefix: 'app',
                style: 'camelCase',
            },
        ],

        '@angular-eslint/component-selector': [
            'warn',
            {
                type: 'element',
                prefix: 'app',
                style: 'kebab-case',
            },
        ],
        '@angular-eslint/component-class-suffix': 'warn',
        '@angular-eslint/component-max-inline-declarations': 'warn',
        '@angular-eslint/no-attribute-decorator': 'warn',
        '@angular-eslint/no-conflicting-lifecycle': 'warn',
        '@angular-eslint/no-input-rename': 'warn',
        '@angular-eslint/no-inputs-metadata-property': 'warn',
        '@angular-eslint/no-lifecycle-call': 'warn',
        '@angular-eslint/no-output-native': 'warn',
        '@angular-eslint/no-output-on-prefix': 'warn',
        '@angular-eslint/no-output-rename': 'warn',
        '@angular-eslint/no-outputs-metadata-property': 'warn',
        '@angular-eslint/no-pipe-impure': 'warn',
        '@angular-eslint/no-queries-metadata-property': 'warn',
        '@angular-eslint/pipe-prefix': 'warn',
        '@angular-eslint/prefer-output-readonly': 'warn',
        '@angular-eslint/prefer-standalone': 'off',
        '@angular-eslint/use-component-selector': 'warn',
        '@angular-eslint/use-lifecycle-interface': 'warn',
        '@angular-eslint/use-pipe-transform-interface': 'warn',
        '@angular-eslint/prefer-signals': 'error',

        /**
         * eslint-plugin-rxjs
         */
        'rxjs-x/ban-observables': 'warn',
        'rxjs-x/ban-operators': 'warn',
        'rxjs-x/no-connectable': 'warn',
        'rxjs-x/no-cyclic-action': 'warn',
        'rxjs-x/no-finnish': 'off',
        'rxjs-x/no-floating-observables': 'warn',
        'rxjs-x/no-ignored-subscribe': 'warn',
        'rxjs-x/no-unsafe-catch': 'warn',
        'rxjs-x/no-unsafe-first': 'warn',
        'rxjs-x/throw-error': 'warn',
        'rxjs-x/no-implicit-any-catch': [
            'warn',
            {
                allowExplicitAny: true,
            },
        ],
        'rxjs-x/no-nested-subscribe': 'warn',
        'rxjs-x/no-unsafe-subject-next': 'off',

        /**
         * eslint-plugin-rxjs-angular
         */
        'rxjs-angular-x/prefer-takeuntil': [
            'warn',
            {
                alias: ['destroyed'],
                checkComplete: false,
                checkDecorators: ['Component'],
                checkDestroy: false,
            },
        ],
    },
};

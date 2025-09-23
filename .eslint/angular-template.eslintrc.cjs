module.exports = {
    plugins: ['@angular-eslint/eslint-plugin-template'],
    extends: ['plugin:@angular-eslint/template/recommended'],
    rules: {
        '@angular-eslint/template/banana-in-box': 'warn',
        '@angular-eslint/template/no-autofocus': 'off',
        '@angular-eslint/template/no-call-expression': ['error'],
        '@angular-eslint/template/no-negated-async': 'warn',
    },
};

// .eslintrc.cjs
module.exports = {
    root: true,
    env: {
      browser: true,
      node:    true,
      es2021:  true,
    },
    parser: 'vue-eslint-parser',
    parserOptions: {
      parser:      '@typescript-eslint/parser',
      ecmaVersion: 2021,
      sourceType:  'module',
    },
    extends: [
      'eslint:recommended',
      'plugin:vue/vue3-recommended',
      'plugin:@typescript-eslint/recommended'
    ],
    rules: {
      // par ex. interdire console.log en prod
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // erreur sur vars non utilisées
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    settings: {
      'import/resolver': {
        typescript: {}
      }
    }
  };
  
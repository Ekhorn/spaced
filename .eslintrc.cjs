module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  ignorePatterns: ['dist', 'node_modules', 'tauri', '*.config.*'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: {
      impliedStrict: true,
    },
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'solid',
    'unicorn',
    'import',
    'prettier',
    'sort-destructure-keys',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:solid/typescript',
    'plugin:prettier/recommended',
    'plugin:unicorn/recommended',
  ],
  rules: {
    'import/order': [
      'error',
      {
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
        ],
        'newlines-between': 'always',
        warnOnUnassignedImports: true,
      },
    ],
    'import/first': 'error',
    'import/extensions': ['error', 'ignorePackages'],
    'solid/reactivity': 'error',
    'solid/self-closing-comp': 'off',
    'solid/event-handlers': 'error',
    'unicorn/filename-case': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'sort-destructure-keys/sort-destructure-keys': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
  },
};

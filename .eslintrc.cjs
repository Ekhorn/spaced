module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  ignorePatterns: [
    // Playwright
    'srcs/e2e/test-results/',
    'srcs/e2e/playwright-report/',
    'srcs/e2e/blob-report/',
    'srcs/e2e/playwright/.cache/',

    // Typescript
    'tsconfig.tsbuildinfo',
    'srcs/slate-solid/lib',
    'srcs/slate-yjs-solid/lib',

    // Rust
    'srcs/tauri',
    'target',

    // Vite
    'dist',

    // NPM
    'node_modules',

    // General
    '*.config.*',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      impliedStrict: true,
    },
    ecmaVersion: 'latest',
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
  overrides: [
    {
      files: ['**/*.md'],
      plugins: ['markdown'],
      processor: 'markdown/markdown',
    },
  ],
  rules: {
    'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
    'import/default': 'error',
    'import/extensions': ['error', 'ignorePackages'],
    'import/first': 'error',
    'import/no-duplicates': ['error', { 'prefer-inline': true }],
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
    'prettier/prettier': 'error',
    'solid/reactivity': 'error',
    'solid/self-closing-comp': 'off',
    'solid/event-handlers': 'error',
    'unicorn/filename-case': 'off',
    'unicorn/no-console-spaces': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'sort-destructure-keys/sort-destructure-keys': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
  },
};

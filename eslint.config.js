import typescriptEslint from '@typescript-eslint/eslint-plugin';
import pluginSolid from 'eslint-plugin-solid';
import unicorn from 'eslint-plugin-unicorn';
import _import from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import markdown from 'eslint-plugin-markdown';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      // Playwright
      'srcs/e2e/test-results/',
      'srcs/e2e/playwright-report/',
      'srcs/e2e/blob-report/',
      'srcs/e2e/playwright/.cache/',

      // Typescript
      '**/tsconfig.tsbuildinfo',
      'srcs/slate-solid/lib',
      'srcs/slate-yjs-solid/lib',

      // Rust
      'srcs/tauri',
      '**/target',

      // Vite
      '**/dist',

      // NPM
      '**/node_modules',

      // General
      '**/*.config.*',
    ],
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:solid/typescript',
    'plugin:prettier/recommended',
    'plugin:unicorn/recommended',
  ),
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      pluginSolid,
      unicorn,
      import: fixupPluginRules(_import),
      prettier,
      'sort-destructure-keys': sortDestructureKeys,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },

    rules: {
      'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
      'import/default': 'error',
      'import/extensions': ['error', 'ignorePackages'],
      'import/first': 'error',

      'import/no-duplicates': [
        'error',
        {
          'prefer-inline': true,
        },
      ],

      'import/order': [
        'error',
        {
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },

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
      'unicorn/prefer-global-this': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'sort-destructure-keys/sort-destructure-keys': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['**/*.md'],

    plugins: {
      markdown,
    },

    processor: 'markdown/markdown',
  },
];

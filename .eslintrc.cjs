// .eslintrc.cjs

/* eslint-env node */ // Use Node.js environment for this config file

module.exports = {
  root: true, // Prevent ESLint from looking further up the directory tree

  // -- Environment --
  // Defines global variables available in different environments
  env: {
    browser: true, // Browser global variables (window, document, etc.)
    es2021: true, // Enables ES2021 globals and syntax (Promise, etc.)
    'vitest-globals/env': true, // Enables Vitest global variables if you use them (describe, it, expect)
  },

  // -- Parser --
  // Specifies the parser ESLint should use
  parser: '@typescript-eslint/parser', // Use the TypeScript parser
  parserOptions: {
    ecmaVersion: 'latest', // Use the latest ECMAScript standard
    sourceType: 'module', // Allow using ES modules (import/export)
    ecmaFeatures: {
      jsx: true, // Enable JSX parsing
    },
    // **IMPORTANT**: Link to your tsconfig for type-aware linting rules
    project: ['./tsconfig.json'],
  },

  // -- Plugins --
  // Adds sets of rules provided by plugins
  plugins: [
    '@typescript-eslint', // Core TypeScript rules
    'react', // React specific rules
    'react-hooks', // Rules for React Hooks
    'jsx-a11y', // Accessibility rules for JSX
    'import', // Rules for ES6+ import/export syntax
    'prettier', // Runs Prettier as an ESLint rule (optional, integrates formatting checks)
    // Add 'vitest-globals' if you installed it
  ],

  // -- Base Configurations (Rule Sets) --
  // Order is important: Later configurations override rules from earlier ones.
  extends: [
    'eslint:recommended', // ESLint's built-in recommended rules
    'plugin:@typescript-eslint/recommended', // Recommended rules from @typescript-eslint
    // Consider enabling this for even stricter type-aware rules, but it can slow down linting:
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended', // Recommended React rules
    'plugin:react/jsx-runtime', // Rules supporting the new JSX transform (React 17+)
    'plugin:react-hooks/recommended', // **CRITICAL**: Enforces Rules of Hooks
    'plugin:import/recommended', // Recommended import/export rules
    'plugin:import/typescript', // Enhances import/export rules for TypeScript
    'plugin:jsx-a11y/recommended', // Recommended accessibility rules for JSX
    // **MUST BE LAST**: Disables ESLint rules that conflict with Prettier formatting
    'eslint-config-prettier',
  ],

  // -- Custom Rules Overrides --
  // Fine-tune or disable rules from the extended configurations
  rules: {
    // --- TypeScript Specific ---
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ], // Warn on unused vars, allowing underscore prefix
    '@typescript-eslint/no-explicit-any': 'warn', // Warn against using 'any' type
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Be explicit about return types on exported functions (can be 'warn' or 'error' for stricter enforcement)

    // --- React Specific ---
    'react/prop-types': 'off', // Disable prop-types validation as we use TypeScript
    'react/react-in-jsx-scope': 'off', // Disable rule requiring React import (handled by new JSX transform)
    'react/display-name': 'warn', // Warn if component lacks display name (helps debugging)

    // --- React Hooks Specific (already covered by 'recommended', but explicit) ---
    'react-hooks/rules-of-hooks': 'error', // Ensure hooks are called correctly
    'react-hooks/exhaustive-deps': 'warn', // Ensure dependency arrays are correct

    // --- Import Specific ---
    'import/order': [
      // Enforce a consistent import order
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
          'type',
        ],
        pathGroups: [
          // Example: Group local src aliases
          { pattern: '@/**', group: 'internal' },
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-unresolved': 'error', // Ensure imported files can be resolved (needs import/resolver settings)

    // --- Accessibility Specific ---
    // Example: Customize if using React Router Link component
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['to'],
      },
    ],

    // --- General Code Quality ---
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Warn on console.log, allow console.warn/error
    eqeqeq: ['error', 'always'], // Require === and !==

    // --- Prettier Integration ---
    // Runs Prettier as an ESLint rule and reports differences as issues.
    'prettier/prettier': 'warn',
  },

  // -- Settings --
  // Shared settings for plugins
  settings: {
    react: {
      version: 'detect', // Automatically detect the React version being used
    },
    'import/resolver': {
      typescript: {
        // Use TypeScript's path resolution defined in tsconfig.json
        project: './tsconfig.json',
      },
      node: true, // Fallback to Node's resolution algorithm
    },
  },

  // -- Files/Directories to Ignore --
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.vite/', // Vite cache directory
    'coverage/', // Test coverage reports
    '*.config.js', // Ignore JS config files (like vite.config.js if not using TS)
    '*.config.cjs', // Ignore CJS config files (like this one)
    '.env',
    '.env.*',
    // Add any other generated files or directories
  ],
};

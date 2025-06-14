import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import securityPlugin from 'eslint-plugin-security';
import importPlugin from 'eslint-plugin-import';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
});

export default [
    // Base configuration
    js.configs.recommended,

    // TypeScript configuration
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
                project: ['./tsconfig.json'],
            },
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                fetch: 'readonly',
                performance: 'readonly',

                // Node.js globals
                process: 'readonly',
                Buffer: 'readonly',
                global: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',

                // TypeScript/React globals
                NodeJS: 'readonly',
                React: 'readonly',
                JSX: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': typescriptPlugin,
            'react': reactPlugin,
            'react-hooks': reactHooksPlugin,
            '@next/next': nextPlugin,
            'security': securityPlugin,
            'import': importPlugin,
        },
        rules: {
            ...typescriptPlugin.configs.recommended.rules,
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            ...nextPlugin.configs.recommended.rules,
            ...securityPlugin.configs.recommended.rules,

            // TypeScript specific rules
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-var-requires': 'error',

            // React specific rules
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/display-name': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // Import rules
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true },
                },
            ],
            'import/no-duplicates': 'error',
            'import/no-unused-modules': 'warn',

            // Security rules
            'security/detect-object-injection': 'warn',
            'security/detect-non-literal-regexp': 'warn',

            // General rules
            // 'no-console': ['error', { allow: ['warn', 'error'] }],
            'no-debugger': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
            },
        },
    },

    // Node.js specific files
    {
        files: ['**/*.config.{js,mjs,ts}', '**/scripts/**/*', 'tscheck.js'],
        languageOptions: {
            globals: {
                process: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                global: 'readonly',
            },
        },
    },

    // Prettier configuration (must be last)
    prettierConfig,

    // Ignore patterns
    {
        ignores: [
            'node_modules/**',
            '.next/**',
            'out/**',
            'dist/**',
            '*.config.js',
            '*.config.mjs',
            'public/**',
        ],
    },
];

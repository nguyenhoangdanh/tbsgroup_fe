// eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo compat layer để sử dụng cú pháp cũ trong cấu hình mới
const compat = new FlatCompat({
    baseDirectory: __dirname,
});

// Cấu hình ESLint cho TypeScript và React
export default [
    // Sử dụng FlatCompat để chuyển đổi cấu hình cũ sang định dạng mới
    ...compat.config({
        extends: [
            'plugin:@typescript-eslint/recommended',
            'plugin:react/recommended',
            'plugin:react-hooks/recommended',
            'plugin:prettier/recommended',
        ],
        parser: '@typescript-eslint/parser',
        parserOptions: {
            project: './tsconfig.json',
            ecmaVersion: 2020,
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true,
            },
        },
    }),

    // Chỉ sử dụng một số rule an toàn từ Next.js plugin
    ...compat.config({
        plugins: ['@next/next'],
        rules: {
            '@next/next/no-img-element': 'warn',
        },
    }),

    // Thêm quy tắc tùy chỉnh
    {
        rules: {
            // Quy tắc React
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // Quy tắc TypeScript
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
            '@typescript-eslint/no-empty-object-type': 'error',
            '@typescript-eslint/no-unsafe-function-type': 'error',
            '@typescript-eslint/no-wrapper-object-types': 'error',
            '@typescript-eslint/no-misused-new': 'error',
            '@typescript-eslint/no-non-null-assertion': 'warn',

            // Cấu hình prettier
            'prettier/prettier': ['error', {
                'endOfLine': 'auto',
                'singleQuote': true,
                'trailingComma': 'all',
                'printWidth': 100,
            }]
        },
    },

    // Loại trừ một số thư mục
    {
        ignores: ['node_modules/**', '.next/**', 'out/**', 'public/**'],
    },
];
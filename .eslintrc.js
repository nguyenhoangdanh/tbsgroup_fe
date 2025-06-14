// module.exports = {
//   root: true,
//   env: {
//     browser: true,
//     es2021: true,
//     node: true,
//   },
//   extends: [
//     'eslint:recommended',
//     '@typescript-eslint/recommended',
//     'next/core-web-vitals',
//     'prettier',
//   ],
//   parser: '@typescript-eslint/parser',
//   parserOptions: {
//     ecmaVersion: 'latest',
//     sourceType: 'module',
//     ecmaFeatures: {
//       jsx: true,
//     },
//     project: './tsconfig.json',
//   },
//   plugins: [
//     '@typescript-eslint',
//     'react',
//     'react-hooks',
//     'import',
//     'security',
//   ],
//   rules: {
//     // Disable problematic rules for build
//     '@typescript-eslint/no-unused-vars': 'warn',
//     '@typescript-eslint/no-explicit-any': 'warn',
//     '@typescript-eslint/ban-ts-comment': 'warn',
//     'react/no-unescaped-entities': 'off',
//     'import/no-unresolved': 'off',
//     'security/detect-object-injection': 'off',
    
//     // TypeScript specific
//     '@typescript-eslint/consistent-type-imports': 'warn',
//     '@typescript-eslint/no-empty-interface': 'warn',
    
//     // React specific
//     'react-hooks/rules-of-hooks': 'error',
//     'react-hooks/exhaustive-deps': 'warn',
//   },
//   settings: {
//     react: {
//       version: 'detect',
//     },
//     'import/resolver': {
//       typescript: {
//         alwaysTryTypes: true,
//         project: './tsconfig.json',
//       },
//     },
//   },
//   overrides: [
//     {
//       files: ['*.ts', '*.tsx'],
//       rules: {
//         '@typescript-eslint/explicit-function-return-type': 'off',
//         '@typescript-eslint/explicit-module-boundary-types': 'off',
//       },
//     },
//     {
//       files: ['*.js', '*.jsx'],
//       rules: {
//         '@typescript-eslint/no-var-requires': 'off',
//       },
//     },
//   ],
//   ignorePatterns: [
//     'node_modules/',
//     '.next/',
//     'out/',
//     'dist/',
//     'build/',
//     '*.config.js',
//     '*.config.ts',
//   ],
// };

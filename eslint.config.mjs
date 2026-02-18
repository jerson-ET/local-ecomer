/**
 * ============================================
 * CONFIGURACIÓN DE ESLINT
 * ============================================
 * 
 * 🛡️ PROPÓSITO:
 * Configuración de ESLint para garantizar
 * código limpio y consistente.
 * 
 * ============================================
 */

/* @ts-check */
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'

export default [
    /* Configuración base de JS */
    js.configs.recommended,

    /* Ignorar archivos */
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            'coverage/**',
            'out/**',
            'dist/**',
            '*.config.js',
            '*.config.mjs',
        ],
    },

    /* Configuración de TypeScript + React */
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                /* Browser globals */
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                fetch: 'readonly',
                URLSearchParams: 'readonly',
                URL: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                performance: 'readonly',

                /* Node.js globals */
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                global: 'readonly',
                module: 'readonly',
                require: 'readonly',

                /* React */
                React: 'readonly',
                JSX: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'react': reactPlugin,
            'react-hooks': hooksPlugin,
        },
        rules: {
            /* TypeScript rules */
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',

            /* React rules */
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-uses-react': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            /* General rules */
            'no-undef': 'off', /* TypeScript handles this */
            'no-unused-vars': 'off', /* Use TypeScript rule instead */
            'no-console': ['warn', {
                allow: ['warn', 'error', 'debug', 'info', 'dir']
            }],
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': ['error', 'always'],
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    /* Configuración específica para archivos de test */
    {
        files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },

    /* Configuración para Service Worker */
    {
        files: ['public/sw.js'],
        languageOptions: {
            globals: {
                self: 'readonly',
                caches: 'readonly',
                fetch: 'readonly',
                clients: 'readonly',
                Request: 'readonly',
                Response: 'readonly',
                URL: 'readonly',
                Promise: 'readonly',
                console: 'readonly',
            },
        },
        rules: {
            'no-undef': 'off',
        },
    },
]

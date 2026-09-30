import prettier from 'eslint-config-prettier';
import path from 'node:path';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['$app/*', '$lib', '$lib/*', '$env/*'],
							message: 'Pakai @/ alias, jangan $ (ex: @/lib/utils, @/app/paths)'
						}
					]
				}
			]
		}
	},
	{
		files: ['src/app/**'],
		rules: { 'no-restricted-imports': 'off' }
	},
	{
		files: ['src/lib/server/**', 'src/routes/api/**'],
		rules: { 'no-restricted-imports': 'off' }
	},
	{
		files: [
			'src/lib/components/hero/hero-grid.svelte',
			'src/routes/tickets/**',
			'src/lib/components/tickets/**'
		],
		linterOptions: { reportUnusedDisableDirectives: 'off' },
		rules: { 'svelte/no-navigation-without-resolve': 'off' }
	}
);

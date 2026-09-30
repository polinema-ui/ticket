import adapter from '@deno/svelte-adapter';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			'@': 'src',
			'@/*': 'src/*'
		}
	}
};

export default config;

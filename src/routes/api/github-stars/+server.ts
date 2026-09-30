import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

let cache: { stars: number; ts: number } | null = null;
const TTL = 5 * 60 * 1000;

export const GET: RequestHandler = async ({ fetch }) => {
	if (cache && Date.now() - cache.ts < TTL) {
		return json({ stars: cache.stars }, { headers: { 'cache-control': 'public, max-age=60' } });
	}

	try {
		const res = await fetch('https://api.github.com/repos/polinema-ui/ticket', {
			headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'polinema-ticket' }
		});

		if (!res.ok) throw new Error(`GitHub ${res.status}`);

		const data = await res.json();
		const stars = typeof data.stargazers_count === 'number' ? data.stargazers_count : 0;

		cache = { stars, ts: Date.now() };

		return json({ stars }, { headers: { 'cache-control': 'public, max-age=300' } });
	} catch {
		if (cache)
			return json({ stars: cache.stars }, { headers: { 'cache-control': 'public, max-age=60' } });
		return json({ stars: 2 }, { headers: { 'cache-control': 'public, max-age=30' } });
	}
};

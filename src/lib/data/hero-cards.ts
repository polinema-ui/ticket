import type { HeroCard } from '@/lib/types/hero.js';

export const GRID_COLS = 10;
export const GRID_ROWS = 3;

export const HERO_CARDS: readonly HeroCard[] = [
	{
		id: '01',
		title: 'feat: add button component\nwith variants',
		icon: null as unknown as HeroCard['icon'],
		col: 2,
		row: 0,
		bg: 'bg-white',
		text: 'text-zinc-900',
		subtext: 'text-zinc-400',
		prNumber: 142,
		status: 'Open',
		description:
			'Menambahkan komponen Button dengan beberapa varian (primary, secondary, outline, ghost).',
		author: 'ckckckcz',
		avatarUrl: 'https://avatars.githubusercontent.com/u/75251355?v=4',
		authorUrl: 'https://github.com/ckckckcz',
		timeAgo: '3h ago',
		additions: 120,
		deletions: 12,
		labels: ['feature', 'component']
	},
	{
		id: '02',
		title: 'fix: handle race condition\non PR sync',
		icon: null as unknown as HeroCard['icon'],
		col: 7,
		row: 1,
		bg: 'bg-white',
		text: 'text-zinc-900',
		subtext: 'text-zinc-400',
		prNumber: 143,
		status: 'Merged',
		description:
			'Perbaiki race condition saat sinkronisasi PR dari GitHub webhook yang double trigger.',
		author: 'a6iyyu',
		avatarUrl: 'https://avatars.githubusercontent.com/u/101570458?v=4',
		authorUrl: 'https://github.com/a6iyyu',
		timeAgo: '5h ago',
		additions: 45,
		deletions: 28,
		labels: ['fix', 'backend']
	},
	{
		id: '03',
		title: 'chore: update deps\n& CI workflow',
		icon: null as unknown as HeroCard['icon'],
		col: 4,
		row: 2,
		bg: 'bg-white',
		text: 'text-zinc-900',
		subtext: 'text-zinc-400',
		prNumber: 144,
		status: 'Draft',
		description: 'Update dependencies dan perbaiki workflow GitHub Actions untuk auto-check.',
		author: 'ckckckcz',
		avatarUrl: 'https://avatars.githubusercontent.com/u/75251355?v=4',
		authorUrl: 'https://github.com/ckckckcz',
		timeAgo: '1d ago',
		additions: 210,
		deletions: 34,
		labels: ['chore', 'ci']
	}
] as const;

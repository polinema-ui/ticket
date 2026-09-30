import type { Ticket } from '@/lib/types/ticket.js';

export const INITIAL_TICKETS: Ticket[] = [
	{
		id: 't-101',
		ticketNumber: 101,
		title: 'feat: add button component with variants',
		description:
			'Menambahkan komponen Button dengan varian primary, secondary, outline, dan ghost untuk styling konsisten di seluruh dashboard.',
		status: 'open',
		priority: 'high',
		category: 'feature',
		author: 'ckckckcz',
		authorAvatar: 'https://avatars.githubusercontent.com/u/75251355?v=4',
		assignee: 'a6iyyu',
		assigneeAvatar: 'https://avatars.githubusercontent.com/u/101570458?v=4',
		githubPrUrl: 'https://github.com/polinema-ui/ticket/pull/142',
		createdAt: '1 jam yang lalu',
		updatedAt: '10 menit yang lalu',
		commentsCount: 4,
		labels: ['ui', 'components']
	},
	{
		id: 't-102',
		ticketNumber: 102,
		title: 'fix: handle race condition on GitHub PR webhook sync',
		description:
			'Sinkronisasi webhook saat merge PR mengalami race condition yang mengakibatkan status ticket tidak ter-update otomatis.',
		status: 'in-progress',
		priority: 'urgent',
		category: 'bug',
		author: 'a6iyyu',
		authorAvatar: 'https://avatars.githubusercontent.com/u/101570458?v=4',
		assignee: 'ckckckcz',
		assigneeAvatar: 'https://avatars.githubusercontent.com/u/75251355?v=4',
		githubPrUrl: 'https://github.com/polinema-ui/ticket/pull/143',
		createdAt: '3 jam yang lalu',
		updatedAt: '30 menit yang lalu',
		commentsCount: 7,
		labels: ['webhook', 'backend']
	},
	{
		id: 't-103',
		ticketNumber: 103,
		title: 'chore: update dependencies and Vitest browser test runner',
		description:
			'Update Svelte 5 runes tooling, Tailwind v4 compiler, dan Playwright integration test suite.',
		status: 'review',
		priority: 'medium',
		category: 'enhancement',
		author: 'ckckckcz',
		authorAvatar: 'https://avatars.githubusercontent.com/u/75251355?v=4',
		githubPrUrl: 'https://github.com/polinema-ui/ticket/pull/144',
		createdAt: '1 hari yang lalu',
		updatedAt: '2 jam yang lalu',
		commentsCount: 2,
		labels: ['tooling', 'ci']
	},
	{
		id: 't-104',
		ticketNumber: 104,
		title: 'docs: document GitHub OAuth workflow and webhook signatures',
		description:
			'Tambahkan dokumentasi lengkap mengenai cara konfigurasi secret webhook dan OAuth callback di repository Polinema.',
		status: 'resolved',
		priority: 'low',
		category: 'enhancement',
		author: 'a6iyyu',
		authorAvatar: 'https://avatars.githubusercontent.com/u/101570458?v=4',
		createdAt: '2 hari yang lalu',
		updatedAt: '1 hari yang lalu',
		commentsCount: 1,
		labels: ['docs']
	}
];

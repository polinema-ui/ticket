import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { IssueItem } from '@/lib/types/ticket.js';
import { DEFAULT_TEMPLATES } from '@/lib/data/issue-templates.js';

let cache: { data: unknown; ts: number } | null = null;
const TTL = 3 * 60 * 1000;

export const GET: RequestHandler = async ({ fetch }) => {
	if (cache && Date.now() - cache.ts < TTL) {
		return json(cache.data, { headers: { 'cache-control': 'public, max-age=60' } });
	}

	const repos: { name: string; html_url: string; open_issues_count: number }[] = [];
	const liveIssues: IssueItem[] = [];
	const repoLabels: Record<string, { name: string; color: string; count: number }[]> = {};
	const repoAssignees: Record<string, { name: string; avatar: string; count: number }[]> = {};

	try {
		const reposRes = await fetch('https://api.github.com/orgs/polinema-ui/repos', {
			headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'polinema-ticket' }
		});

		if (reposRes.ok) {
			const repoData = await reposRes.json();
			if (Array.isArray(repoData)) {
				const filtered = repoData
					.filter((r) => !r.name.startsWith('.') && r.name !== '.github')
					.map((r) => ({
						name: r.name,
						html_url: r.html_url,
						open_issues_count: typeof r.open_issues_count === 'number' ? r.open_issues_count : 0
					}));
				repos.push(...filtered);
			}
		}
	} catch {
		void 0;
	}

	if (!repos.some((r) => r.name === 'p-ui')) {
		repos.unshift({
			name: 'p-ui',
			html_url: 'https://github.com/polinema-ui/p-ui',
			open_issues_count: 0
		});
	}
	if (!repos.some((r) => r.name === 'ticket')) {
		repos.push({
			name: 'ticket',
			html_url: 'https://github.com/polinema-ui/ticket',
			open_issues_count: 0
		});
	}

	for (const repo of repos) {
		repoLabels[repo.name] = [];
		repoAssignees[repo.name] = [];

		try {
			const issuesRes = await fetch(
				`https://api.github.com/repos/polinema-ui/${repo.name}/issues?state=all&per_page=50`,
				{
					headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'polinema-ticket' }
				}
			);

			if (issuesRes.ok) {
				const list = await issuesRes.json();
				if (Array.isArray(list)) {
					for (const item of list) {
						liveIssues.push({
							id: item.id,
							number: item.number,
							title: item.title,
							description: item.body ? item.body.slice(0, 140) : '',
							state: item.state === 'closed' ? 'closed' : 'open',
							status:
								item.state === 'closed' ? 'Closed' : item.pull_request ? 'In Progress' : 'Open',
							labels: Array.isArray(item.labels)
								? item.labels.map((l: { name: string; color: string }) => ({
										name: l.name,
										bg: `bg-[#${l.color}15]`,
										text: `text-[#${l.color}]`,
										border: `border-[#${l.color}30]`
									}))
								: [{ name: 'general', bg: 'bg-zinc-100', text: 'text-zinc-700' }],
							commentsCount: item.comments || 0,
							author: {
								name: item.user?.login || 'contributor',
								avatar:
									item.user?.avatar_url || 'https://avatars.githubusercontent.com/u/75251355?v=4'
							},
							timeAgo: item.created_at
								? new Date(item.created_at).toLocaleDateString('id-ID', {
										day: 'numeric',
										month: 'short'
									})
								: 'recently',
							assignee: item.assignee
								? {
										name: item.assignee.login,
										avatar: item.assignee.avatar_url
									}
								: undefined,
							htmlUrl: item.html_url,
							isPr: !!item.pull_request,
							repo: repo.name,
							milestone: item.milestone?.title
						});
					}
				}
			}
		} catch {
			void 0;
		}

		try {
			const labelsRes = await fetch(
				`https://api.github.com/repos/polinema-ui/${repo.name}/labels?per_page=30`,
				{
					headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'polinema-ticket' }
				}
			);
			if (labelsRes.ok) {
				const labelsData = await labelsRes.json();
				if (Array.isArray(labelsData)) {
					repoLabels[repo.name] = labelsData.map((l) => {
						const count = liveIssues.filter(
							(i) =>
								i.repo === repo.name &&
								i.labels.some((lbl) => lbl.name.toLowerCase() === l.name.toLowerCase())
						).length;
						return {
							name: l.name,
							color: `bg-[#${l.color}15] text-[#${l.color}] border-[#${l.color}30]`,
							count
						};
					});
				}
			}
		} catch {
			void 0;
		}

		try {
			const contribRes = await fetch(
				`https://api.github.com/repos/polinema-ui/${repo.name}/contributors?per_page=10`,
				{
					headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'polinema-ticket' }
				}
			);
			if (contribRes.ok) {
				const contribData = await contribRes.json();
				if (Array.isArray(contribData)) {
					repoAssignees[repo.name] = contribData.map((c) => {
						const count = liveIssues.filter(
							(i) => i.repo === repo.name && i.assignee?.name === c.login
						).length;
						return {
							name: c.login,
							avatar: c.avatar_url,
							count
						};
					});
				}
			}
		} catch {
			void 0;
		}
	}

	const payload = {
		repos,
		issues: liveIssues,
		templates: DEFAULT_TEMPLATES,
		repoMeta: {
			labels: repoLabels,
			assignees: repoAssignees
		}
	};

	cache = { data: payload, ts: Date.now() };

	return json(payload, { headers: { 'cache-control': 'public, max-age=60' } });
};

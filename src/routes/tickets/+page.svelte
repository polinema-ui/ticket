<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { resolve } from '@/app/paths';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Search01Icon,
		Add01Icon,
		Comment01Icon,
		Tag01Icon,
		User02Icon,
		ArrowLeft01Icon,
		GitPullRequestIcon,
		ArrowRight01Icon,
		CheckmarkCircle02Icon,
	} from '@hugeicons/core-free-icons';
	import Button from '@/lib/components/ui/button/button.svelte';
	import NewIssueModal from '@/lib/components/tickets/new-issue-modal.svelte';
	import type { IssueItem, IssueTemplate } from '@/lib/types/ticket.js';

	let selectedRepo = $state<string>('p-ui');
	let activeTab = $state<'open' | 'closed' | 'all'>('open');
	let searchQuery = $state('');
	let selectedLabel = $state<string | null>(null);
	let selectedSort = $state<'newest' | 'oldest' | 'comments'>('newest');
	let currentPage = $state(1);
	const pageSize = 10;

	let isModalOpen = $state(false);

	let issues = $state<IssueItem[]>([]);
	let templates = $state<IssueTemplate[]>([]);
	let repos = $state<{ name: string; html_url: string; open_issues_count: number }[]>([]);
	let repoMeta = $state<{
		labels: Record<string, { name: string; color: string; count: number }[]>;
		assignees: Record<string, { name: string; avatar: string; count: number }[]>;
	}>({ labels: {}, assignees: {} });

	let selectedIssueIds = new SvelteSet<string | number>();

	onMount(async () => {
		try {
			const res = await fetch('/api/github-issues');
			if (res.ok) {
				const data = await res.json();
				issues = data.issues || [];
				templates = data.templates || [];
				repos = data.repos || [];
				if (data.repoMeta) repoMeta = data.repoMeta;
			}
		} catch {
			void 0;
		}
	});

	let repoIssues = $derived(issues.filter((i) => !selectedRepo || i.repo === selectedRepo));
	let openCount = $derived(repoIssues.filter((i) => i.state === 'open').length);
	let closedCount = $derived(repoIssues.filter((i) => i.state === 'closed').length);
	let allCount = $derived(repoIssues.length);

	let activeLabels = $derived(repoMeta.labels[selectedRepo] || []);
	let activeAssignees = $derived(repoMeta.assignees[selectedRepo] || []);
	let filteredIssues = $derived(
		repoIssues.filter((item) => {
			const matchesTab =
				activeTab === 'all' ||
				(activeTab === 'open' && item.state === 'open') ||
				(activeTab === 'closed' && item.state === 'closed');

			const q = searchQuery.toLowerCase().trim();
			const matchesQuery =
				q === '' ||
				item.title.toLowerCase().includes(q) ||
				item.description.toLowerCase().includes(q) ||
				item.number.toString().includes(q) ||
				item.author.name.toLowerCase().includes(q);

			const matchesLabel =
				!selectedLabel ||
				item.labels.some((l) => l.name.toLowerCase() === selectedLabel?.toLowerCase());

			return matchesTab && matchesQuery && matchesLabel;
		})
	);

	let sortedIssues = $derived(
		[...filteredIssues].sort((a, b) => {
			if (selectedSort === 'comments') return b.commentsCount - a.commentsCount;
			if (selectedSort === 'oldest') return a.number - b.number;
			return b.number - a.number;
		})
	);

	let totalPages = $derived(Math.max(1, Math.ceil(sortedIssues.length / pageSize)));
	let paginatedIssues = $derived(
		sortedIssues.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	const toggleSelect = (id: string | number) => {
		if (selectedIssueIds.has(id)) selectedIssueIds.delete(id);
		else selectedIssueIds.add(id);
	};

	const getStatusPill = (status: string) => {
		switch (status) {
			case 'Open':
				return 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]';
			case 'In Progress':
				return 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]';
			case 'Review':
				return 'bg-[#faf5ff] text-[#7c3aed] border-[#e9d5ff]';
			case 'Planned':
				return 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]';
			case 'Closed':
				return 'bg-zinc-100 text-zinc-600 border-zinc-200';
			default:
				return 'bg-zinc-100 text-zinc-600 border-zinc-200';
		}
	};
</script>

<svelte:head>
	<title>Issues - Polinema UI</title>
</svelte:head>

<div
	class="min-h-screen bg-white font-sans text-zinc-900 selection:bg-blue-500 selection:text-white"
>
	<div class="border-b border-zinc-200 bg-white/70 px-4 py-2.5 backdrop-blur-md sm:px-8">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<Button
				href={resolve('/')}
				variant="outline"
				size="sm"
				class="gap-1.5 border-zinc-200 bg-white text-zinc-600 hover:bg-gray-200  hover:text-black"
			>
				<HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
				<span>Back to Home</span>
			</Button>

			<div
				class="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-2xs"
			>
				<span class="px-2 text-xs font-semibold text-zinc-400">Repo:</span>
				{#each repos as r (r.name)}
					<button
						type="button"
						onclick={() => {
							selectedRepo = r.name;
							currentPage = 1;
						}}
						class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors {selectedRepo ===
						r.name
							? 'bg-blue-600 text-white shadow-2xs'
							: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}"
					>
						<HugeiconsIcon icon={GitPullRequestIcon} size={12} />
						<span>polinema-ui/{r.name}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-8">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Issues</h1>
				<p class="mt-1 text-xs text-zinc-500 sm:text-sm">
					Track and manage feature requests, bug reports, and improvements for Polinema UI.
				</p>
			</div>

			<Button
				onclick={() => (isModalOpen = true)}
				variant="default"
				size="default"
				class="gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
			>
				<HugeiconsIcon icon={Add01Icon} size={16} />
				<span>New Ticket</span>
			</Button>
		</div>

		<div class="mt-6 flex flex-wrap items-center gap-1 border-b border-zinc-200">
			<button
				type="button"
				onclick={() => {
					activeTab = 'open';
					currentPage = 1;
				}}
				class="flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors {activeTab ===
				'open'
					? 'border-blue-600 text-blue-600'
					: 'border-transparent text-zinc-500 hover:text-zinc-800'}"
			>
				<span>Open</span>
				<span class="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
					{openCount}
				</span>
			</button>

			<button
				type="button"
				onclick={() => {
					activeTab = 'closed';
					currentPage = 1;
				}}
				class="flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors {activeTab ===
				'closed'
					? 'border-blue-600 text-blue-600'
					: 'border-transparent text-zinc-500 hover:text-zinc-800'}"
			>
				<span>Closed</span>
				<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">
					{closedCount}
				</span>
			</button>

			<button
				type="button"
				onclick={() => {
					activeTab = 'all';
					currentPage = 1;
				}}
				class="flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors {activeTab ===
				'all'
					? 'border-blue-600 text-blue-600'
					: 'border-transparent text-zinc-500 hover:text-zinc-800'}"
			>
				<span>All</span>
				<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">
					{allCount}
				</span>
			</button>
		</div>

		<div class="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
			<div class="relative flex-1">
				<span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
					<HugeiconsIcon icon={Search01Icon} size={15} />
				</span>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search issues..."
					class="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-4 pl-9 text-xs text-zinc-900 shadow-2xs transition-colors outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				{#if selectedLabel}
					<button
						type="button"
						onclick={() => (selectedLabel = null)}
						class="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
					>
						<span>Label: {selectedLabel}</span>
						<span class="text-blue-500">&times;</span>
					</button>
				{/if}

				<select
					bind:value={selectedLabel}
					class="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs outline-none focus:border-blue-500"
				>
					<option value={null}>Labels ▾</option>
					{#each activeLabels as l (l.name)}
						<option value={l.name}>{l.name} ({l.count})</option>
					{/each}
				</select>

				<select
					bind:value={selectedSort}
					class="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-2xs outline-none focus:border-blue-500"
				>
					<option value="newest">Sort: Newest</option>
					<option value="oldest">Sort: Oldest</option>
					<option value="comments">Sort: Most Comments</option>
				</select>
			</div>
		</div>

		<div class="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
			<div class="lg:col-span-3">
				<div class="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs">
					{#if paginatedIssues.length === 0}
						<div class="p-12 text-center">
							<p class="text-sm font-semibold text-zinc-700">No issues found</p>
							<p class="mt-1 text-xs text-zinc-400">Try adjusting your filters or search query.</p>
						</div>
					{:else}
						{#each paginatedIssues as issue (issue.id)}
								<div class="group flex items-center gap-3.5 p-4 transition-colors hover:bg-zinc-50/70">
									<div class="shrink-0">
										{#if issue.state === 'open'}
											<span
												class="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"
												title="Open"
											>
												<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
											</span>
										{:else}
											<span
												class="flex h-6 w-6 items-center justify-center rounded-full bg-[#8250df] text-white"
												title="Closed"
											>
												<HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
											</span>
										{/if}
									</div>

									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-center gap-1.5">
											<a
												href={issue.htmlUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="text-[13px] font-semibold leading-5 text-zinc-900 hover:text-blue-600 hover:underline decoration-blue-600/30 underline-offset-2 sm:text-sm"
											>
												{issue.title}
											</a>
											<span class="shrink-0 text-[11px] font-medium text-zinc-400">#{issue.number}</span>
											{#if issue.isPr}
												<span
													class="inline-flex items-center rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-600"
													>PR</span
												>
											{/if}
										</div>

										{#if issue.description}
											<p class="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 sm:line-clamp-1">
												{issue.description}
											</p>
										{/if}

										<div class="mt-2.5 flex flex-wrap items-center gap-1.5">
											{#each issue.labels as l (l.name)}
												<button
													type="button"
													onclick={() => (selectedLabel = l.name)}
													class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none {l.bg} {l.text} {l.border ?? 'border-zinc-200'} hover:opacity-80"
												>
													<span>{l.name}</span>
													<HugeiconsIcon icon={ArrowRight01Icon} size={12} />
												</button>
											{/each}

											<span class="ml-1 inline-flex items-center gap-1.5 text-xs text-zinc-400">
												<span class="inline-flex items-center gap-1">
													<HugeiconsIcon icon={Comment01Icon} size={12} />
													<span class="tabular-nums">{issue.commentsCount}</span>
												</span>
												<span class="h-3 w-px bg-zinc-200" aria-hidden="true"></span>
												<span class="inline-flex items-center gap-1.5">
													<img
														src={issue.author.avatar}
														alt={issue.author.name}
														class="h-4 w-4 rounded-full object-cover ring-1 ring-black/5"
													/>
													<span class="font-medium text-zinc-600">{issue.author.name}</span>
												</span>
												{#if issue.assignee}
													<HugeiconsIcon icon={ArrowRight01Icon} size={11} class="text-zinc-400" />
													<span class="inline-flex items-center gap-1">
														<img
															src={issue.assignee.avatar}
															alt={issue.assignee.name}
															class="h-4 w-4 rounded-full object-cover ring-1 ring-white"
														/>
														<span class="hidden sm:inline text-zinc-500">{issue.assignee.name}</span>
													</span>
												{/if}
												<span class="text-zinc-300">·</span>
												<span>{issue.timeAgo}</span>
											</span>
										</div>
									</div>

									<div class="hidden shrink-0 sm:flex sm:items-center sm:pt-1">
										<span
											class="inline-flex items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium leading-none text-zinc-600"
										>
											<span class="h-1.5 w-1.5 shrink-0 rounded-full {issue.state === 'open' ? 'bg-emerald-500' : 'bg-[#8250df]'}"></span>
											<span class="leading-none">{issue.state}</span>
										</span>
									</div>
								</div>
							{/each}
					{/if}
				</div>

				<div
					class="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-zinc-500 sm:flex-row"
				>
					<span>
						Showing {(currentPage - 1) * pageSize + 1}-{Math.min(
							currentPage * pageSize,
							sortedIssues.length
						)} of {sortedIssues.length} issues
					</span>

					<div class="flex items-center gap-1">
						<button
							type="button"
							disabled={currentPage <= 1}
							onclick={() => (currentPage -= 1)}
							class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
						>
							&lt;
						</button>
						{#each Array(totalPages).keys() as idx (idx)}
							{@const pageNum = idx + 1}
							<button
								type="button"
								onclick={() => (currentPage = pageNum)}
								class="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors {currentPage ===
								pageNum
									? 'bg-blue-600 text-white'
									: 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'}"
							>
								{pageNum}
							</button>
						{/each}
						<button
							type="button"
							disabled={currentPage >= totalPages}
							onclick={() => (currentPage += 1)}
							class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
						>
							&gt;
						</button>
					</div>
				</div>
			</div>

			<div class="space-y-6 lg:col-span-1">
				<div class="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
					<div class="flex items-center gap-2 border-b border-zinc-100 pb-3">
						<HugeiconsIcon icon={Tag01Icon} size={15} color="#4b5563" />
						<h2 class="text-xs font-bold tracking-tight text-zinc-900">Labels</h2>
					</div>
					<div class="mt-3 space-y-2">
						{#if activeLabels.length === 0}
							<p class="text-xs text-zinc-400">Belum ada label di repo ini.</p>
						{:else}
							{#each activeLabels as lbl (lbl.name)}
								<button
									type="button"
									onclick={() => (selectedLabel = selectedLabel === lbl.name ? null : lbl.name)}
									class="flex w-full items-center justify-between text-left transition-opacity hover:opacity-80"
								>
									<span class="rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none {lbl.color}">
										{lbl.name}
									</span>
									<span class="text-xs font-medium text-zinc-400">{lbl.count}</span>
								</button>
							{/each}
						{/if}
					</div>
				</div>

				<div class="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
					<div class="flex items-center gap-2 border-b border-zinc-100 pb-3">
						<HugeiconsIcon icon={User02Icon} size={15} color="#4b5563" />
						<h2 class="text-xs font-bold tracking-tight text-zinc-900">Assignees</h2>
					</div>
					<div class="mt-3 space-y-2.5">
						{#if activeAssignees.length === 0}
							<p class="text-xs text-zinc-400">Belum ada assignee di repo ini.</p>
						{:else}
							{#each activeAssignees as a (a.name)}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<img src={a.avatar} alt={a.name} class="h-5 w-5 rounded-full object-cover" />
										<span class="text-xs font-medium text-zinc-700">{a.name}</span>
									</div>
									<span class="text-xs font-medium text-zinc-400">{a.count}</span>
								</div>
							{/each}
						{/if}
					</div>
					<div class="mt-3.5 border-t border-zinc-100 pt-2.5">
						<a
							href={`https://github.com/polinema-ui/${selectedRepo}/graphs/contributors`}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
						>
							<span>View all contributors</span>
							<HugeiconsIcon icon={ArrowRight01Icon} size={12} />
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<NewIssueModal bind:isOpen={isModalOpen} {templates} activeRepo={selectedRepo} />

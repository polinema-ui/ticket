<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '@/app/paths';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		ArrowLeft01Icon,
		GitPullRequestIcon,
	} from '@hugeicons/core-free-icons';
	import Button from '@/lib/components/ui/button/button.svelte';
	import NewIssueModal from '@/lib/components/tickets/new-issue-modal.svelte';
	import TicketCard from '@/lib/components/tickets/ticket-card.svelte';
	import TicketSidebar from '@/lib/components/tickets/ticket-sidebar.svelte';
	import TicketPagination from '@/lib/components/tickets/ticket-pagination.svelte';
	import TicketFilters from '@/lib/components/tickets/ticket-filters.svelte';
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
		labels: Record<string, { name: string; color: string; colorHex?: string; count: number }[]>;
		assignees: Record<string, { name: string; avatar: string; count: number }[]>;
	}>({ labels: {}, assignees: {} });
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

	let paginatedIssues = $derived(
		sortedIssues.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

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
		<TicketFilters
			bind:isModalOpen
			bind:activeTab
			bind:currentPage
			bind:searchQuery
			bind:selectedLabel
			bind:selectedSort
			{openCount}
			{closedCount}
			{allCount}
			{activeLabels}
		/>

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
							<TicketCard {issue} onLabelClick={(name) => selectedLabel = name} />
						{/each}
					{/if}
				</div>

				<TicketPagination bind:currentPage {pageSize} totalItems={sortedIssues.length} />
			</div>

			<TicketSidebar {activeLabels} {activeAssignees} {selectedRepo} bind:selectedLabel />
		</div>
	</div>
</div>

<NewIssueModal bind:isOpen={isModalOpen} {templates} activeRepo={selectedRepo} />

<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Add01Icon, Search01Icon } from '@hugeicons/core-free-icons';
	import Button from '@/lib/components/ui/button/button.svelte';
	import Select from '@/lib/components/ui/select/select.svelte';

	let {
		isModalOpen = $bindable(false),
		activeTab = $bindable('open'),
		currentPage = $bindable(1),
		searchQuery = $bindable(''),
		selectedLabel = $bindable(null),
		selectedSort = $bindable('newest'),
		openCount,
		closedCount,
		allCount,
		activeLabels
	}: {
		isModalOpen: boolean;
		activeTab: 'open' | 'closed' | 'all';
		currentPage: number;
		searchQuery: string;
		selectedLabel: string | null;
		selectedSort: 'newest' | 'oldest' | 'comments';
		openCount: number;
		closedCount: number;
		allCount: number;
		activeLabels: { name: string; count: number }[];
	} = $props();
</script>

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
		class="gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-all active:scale-95"
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
		<Select
			bind:value={selectedLabel}
			options={[
				{ label: 'Labels', value: null },
				...activeLabels.map((l) => ({ label: `${l.name} (${l.count})`, value: l.name }))
			]}
			placeholder="Labels"
		/>

		<Select
			bind:value={selectedSort}
			options={[
				{ label: 'Sort: Newest', value: 'newest' },
				{ label: 'Sort: Oldest', value: 'oldest' },
				{ label: 'Sort: Most Comments', value: 'comments' }
			]}
			placeholder="Sort"
		/>
	</div>
</div>
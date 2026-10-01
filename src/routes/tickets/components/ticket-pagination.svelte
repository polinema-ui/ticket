<script lang="ts">
	import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
	import { HugeiconsIcon } from '@hugeicons/svelte';

	let {
		currentPage = $bindable(1),
		pageSize,
		totalItems
	}: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
	} = $props();

	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
</script>

<div class="mt-4 flex flex-col items-center justify-between gap-3 text-xs text-zinc-500 sm:flex-row">
	<span>
		Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems} issues
	</span>

	<div class="flex items-center gap-1">
		<button
			type="button"
			disabled={currentPage <= 1}
			onclick={() => (currentPage -= 1)}
			class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
		>
			<HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
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
			<HugeiconsIcon icon={ArrowRight01Icon} size={14} />
		</button>
	</div>
</div>
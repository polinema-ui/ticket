<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Tag01Icon, User02Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
	import Badge from '@/lib/components/ui/badge/badge.svelte';

	let {
		activeLabels,
		activeAssignees,
		selectedRepo,
		selectedLabel = $bindable()
	}: {
		activeLabels: { name: string; colorHex?: string; count: number }[];
		activeAssignees: { name: string; avatar: string; count: number }[];
		selectedRepo: string;
		selectedLabel: string | null;
	} = $props();
</script>

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
						<Badge
							variant={selectedLabel === lbl.name ? 'default' : 'outline'}
							style={lbl.colorHex ? `background-color: #${lbl.colorHex}22; color: color-mix(in srgb, #${lbl.colorHex} 40%, black); border-color: #${lbl.colorHex}66` : ''}
							class="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-[11px] font-bold leading-normal shadow-2xs transition-all hover:scale-[1.02]"
						>
							{lbl.name}
						</Badge>
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
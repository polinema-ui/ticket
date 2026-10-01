<script lang="ts">
	import Badge from '@/lib/components/ui/badge/badge.svelte';
	import type { IssueItem } from '@/lib/types/ticket.js';
	import { ArrowRight01Icon, Comment01Icon } from '@hugeicons/core-free-icons';
	import { HugeiconsIcon } from '@hugeicons/svelte';

	let {
		issue,
		onLabelClick
	}: {
		issue: IssueItem;
		onLabelClick: (label: string) => void;
	} = $props();
</script>

<div class="group flex items-center gap-3.5 p-4 transition-colors hover:bg-zinc-50/70">
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
				>PR</span>
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
					onclick={() => onLabelClick(l.name)}
					class="transition-opacity hover:opacity-80"
				>
					<Badge
						variant="outline"
						class="inline-flex items-center justify-center rounded-lg px-3 py-1 text-[11px] font-bold leading-normal shadow-2xs transition-all hover:scale-[1.02]"
						style={l.colorHex ? `background-color: #${l.colorHex}22; color: color-mix(in srgb, #${l.colorHex} 40%, black); border-color: #${l.colorHex}66` : ''}
					>
						<span>{l.name}</span>
					</Badge>
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
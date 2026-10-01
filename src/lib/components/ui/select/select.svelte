<script lang="ts">
	import { cn } from '@/lib/utils.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { ArrowDown01Icon } from '@hugeicons/core-free-icons';

	let {
		value = $bindable(''),
		options = [],
		placeholder = 'Select...',
		class: className = '',
		onchange
	}: {
		value?: string | null;
		options: { label: string; value: string | null }[];
		placeholder?: string;
		class?: string;
		onchange?: (val: string | null) => void;
	} = $props();

	let isOpen = $state(false);
	let selectedOption = $derived(options.find((o) => o.value === value));

	function handleSelect(val: string | null) {
		value = val;
		isOpen = false;
		if (onchange) onchange(val);
	}
</script>

<div class="relative inline-block text-left">
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class={cn(
			'inline-flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400',
			className
		)}
	>
		<span>{selectedOption ? selectedOption.label : placeholder}</span>
		<HugeiconsIcon icon={ArrowDown01Icon} size={14} class="text-zinc-500 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
	</button>

	{#if isOpen}
		<button
			type="button"
			tabindex="-1"
			class="fixed inset-0 z-30 cursor-default bg-transparent"
			onclick={() => (isOpen = false)}
			aria-label="Close select"
		></button>

		<div
			class="absolute right-0 z-40 mt-1 min-w-35 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
		>
			{#each options as opt (opt.label)}
				<button
					type="button"
					onclick={() => handleSelect(opt.value)}
					class={cn(
						'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors text-left',
						value === opt.value
							? 'bg-zinc-100 font-semibold text-zinc-900'
							: 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
					)}
				>
					<span>{opt.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import { cn } from '@/lib/utils.js';
	let {
		variant = 'default',
		class: className = '',
		children,
		...rest
	}: {
		variant?: 'default' | 'outline' | 'secondary';
		class?: string;
		children?: import('svelte').Snippet;
		[key: string]: unknown;
	} = $props();

	const variants: Record<string, string> = {
		default: 'bg-[#a3f3a3] text-[#0a1a14] border-transparent',
		secondary: 'bg-white/10 text-white border-white/10',
		outline: 'border-white/20 text-white'
	};
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
		variants[variant],
		className
	)}
	{...rest}
>
	{@render children?.()}
</span>

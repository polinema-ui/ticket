<script lang="ts">
	import { cn } from '@/lib/utils.js';

	type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
	type Size = 'default' | 'sm' | 'lg' | 'icon';

	let {
		variant = 'default' as Variant,
		size = 'default' as Size,
		class: className = '',
		children,
		href,
		...rest
	}: {
		variant?: Variant;
		size?: Size;
		class?: string;
		children?: import('svelte').Snippet;
		href?: string;
		[key: string]: unknown;
	} = $props();

	const base =
		'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0';

	const variants: Record<Variant, string> = {
		default:
			'border border-blue-800 bg-blue-700 text-white shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-blue-600',
		secondary:
			'border border-neutral-700 bg-neutral-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-neutral-500',
		outline:
			'border border-neutral-200 bg-transparent hover:bg-neutral-100 hover:text-neutral-900 dark:border-white/10 dark:hover:bg-white/10 dark:hover:text-white',
		ghost:
			'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white',
		destructive:
			'border border-red-700 bg-red-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-red-500',
		link: 'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400'
	};

	const sizes: Record<Size, string> = {
		default: 'h-10 px-4 py-2',
		sm: 'h-8 px-3 text-xs',
		lg: 'h-12 px-6 text-base',
		icon: 'h-10 w-10'
	};
</script>

{#if href}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<a {href} class={cn(base, variants[variant], sizes[size], className)} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button class={cn(base, variants[variant], sizes[size], className)} {...rest}>
		{@render children?.()}
	</button>
{/if}

<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '@/app/paths';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import Button from '@/lib/components/ui/button/button.svelte';
	import logo from '@/lib/assets/logo.png';
	import { GithubIcon } from '@hugeicons/core-free-icons';

	let stars = $state(2);

	onMount(async () => {
		try {
			const res = await fetch('/api/github-stars');
			if (res.ok) {
				const data = await res.json();
				if (typeof data.stars === 'number') stars = data.stars;
			}
		} catch {
			void 0;
		}
	});
</script>

<header
	class="flex h-13 shrink-0 items-center border-b border-zinc-200 bg-white/80 backdrop-blur-xl"
>
	<div class="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<a href={resolve('/')} class="flex items-center gap-2.5">
			<img src={logo} alt="P-Ticket logo" class="h-8 w-8 rounded-md object-contain" />
			<span class="text-[15px] font-semibold tracking-tight text-[#0a1a14]">Polinema Ticket</span>
		</a>

		<div class="flex items-center gap-2">
			<Button
				href="https://github.com/polinema-ui/ticket"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Star on GitHub, {stars} stars"
				variant="outline"
				class="hidden h-9 gap-2 rounded-md border-zinc-200 bg-white px-4 text-zinc-900 sm:inline-flex dark:border-zinc-200 dark:bg-white dark:text-zinc-900"
			>
				<HugeiconsIcon icon={GithubIcon} size={18} color="#0a1a14" class="shrink-0" />
				<span class="text-[16px] leading-none font-semibold text-black">{stars}</span>
			</Button>
		</div>
	</div>
</header>

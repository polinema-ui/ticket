<script lang="ts">
	import { onMount } from 'svelte';
	import PixelSwap from '@/lib/components/atoms/pixel-swap.svelte';

	let active = $state(false);
	let visible = $state(true);

	onMount(() => {
		const t = setTimeout(() => {
			active = true;
		}, 1200);

		return () => clearTimeout(t);
	});

	const onComplete = () => {
		visible = false;
	};
</script>

{#if visible}
	<PixelSwap
		title="Polinema Ticket"
		bgColor="#2563eb"
		pixelSize={58}
		duration={1400}
		pixelDuration={360}
		{active}
		{onComplete}
	/>
{/if}

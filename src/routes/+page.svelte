<script lang="ts">
	import Navbar from '@/lib/components/navbar/navbar.svelte';
	import HeroIntro from '@/lib/components/hero/hero-intro.svelte';
	import HeroGrid from '@/lib/components/hero/hero-grid.svelte';
</script>

<svelte:head>
	<title>Polinema Ticket</title>
	<meta
		name="description"
		content="Automate GitHub PR & ticketing workflow — auto link, assign, track."
	/>
</svelte:head>

<div
	class="flex h-screen flex-col overflow-hidden bg-white text-zinc-900 selection:bg-blue-500 selection:text-white"
>
	<Navbar />
	<section class="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
		<HeroIntro />
		<HeroGrid />
	</section>
</div>

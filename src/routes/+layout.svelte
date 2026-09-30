<script lang="ts">
	import './layout.css';
	import AppLoader from '@/lib/components/atoms/app-loader.svelte';
	import logo from '@/lib/assets/logo.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" type="image/png" href={logo} /></svelte:head>
<AppLoader />
{@render children()}

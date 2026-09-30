<script lang="ts">
	import './layout.css';
	import logo from '@/lib/assets/logo.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" type="image/png" href={logo} /></svelte:head>
{@render children()}

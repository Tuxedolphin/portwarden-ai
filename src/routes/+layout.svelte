<script>
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeTheme } from '$lib/utils/theme';

	let { children } = $props();

	// Initialize theme on layout mount
	onMount(() => {
		initializeTheme();
	});
</script>

{@render children()}

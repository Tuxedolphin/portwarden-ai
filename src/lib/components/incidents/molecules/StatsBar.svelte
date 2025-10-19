<script>
	import StatItem from '../atoms/StatItem.svelte';
	
	let { items } = $props();
	
	const openCount = $derived(items.filter((/** @type {any} */ i) => i.status === 'open').length);
	const inProgressCount = $derived(items.filter((/** @type {any} */ i) => i.status === 'in-progress').length);
	const resolvedCount = $derived(items.filter((/** @type {any} */ i) => i.status === 'resolved').length);
	const totalCount = $derived(items.length);
</script>

<div class="stats-bar">
	<StatItem value={openCount} label="Open" />
	<StatItem value={inProgressCount} label="In Progress" />
	<StatItem value={resolvedCount} label="Resolved" />
	<StatItem value={totalCount} label="Total" />
</div>

<style>
	.stats-bar {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1.5rem;
	}
</style>
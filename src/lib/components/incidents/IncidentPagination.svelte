<script>
	import { createEventDispatcher } from 'svelte';

	export let page = 1;
	export let totalPages = 1;

	const dispatch = createEventDispatcher();

	function prev() {
		dispatch('prev');
	}

	function next() {
		dispatch('next');
	}
</script>

{#if totalPages > 1}
	<nav class="incident-pagination" aria-label="Incident pages">
		<button class="button-secondary" type="button" on:click={prev} disabled={page === 1}>
			Previous
		</button>
		<span>Page {page} of {totalPages}</span>
		<button class="button-secondary" type="button" on:click={next} disabled={page === totalPages}>
			Next
		</button>
	</nav>
{/if}

<style src="./IncidentPagination.css"></style>

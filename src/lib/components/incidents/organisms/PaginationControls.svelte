<script>
	import { Button } from '$lib/components/ui';

	let { page, pageSize, total, onPrevious, onNext } = $props();

	const totalPages = $derived(Math.ceil(total / pageSize));
	const canGoPrevious = $derived(page > 1);
	const canGoNext = $derived(page < totalPages);
</script>

{#if total > pageSize}
	<div class="pagination">
		<Button variant="outline" disabled={!canGoPrevious} onclick={onPrevious}>Previous</Button>

		<span class="page-info">
			Page {page} of {totalPages}
		</span>

		<Button variant="outline" disabled={!canGoNext} onclick={onNext}>Next</Button>
	</div>
{/if}

<style>
	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 2rem 0;
	}

	.page-info {
		color: #94a3b8;
		font-weight: 500;
	}
</style>

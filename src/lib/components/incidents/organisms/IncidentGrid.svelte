<script>
	import { Button } from '$lib/components/ui';
	import IncidentCard from '../molecules/IncidentCard.svelte';
	
	let { 
		items = [],
		statusOptions = [],
		onStatusUpdate,
		onSelectForAI,
		onArchive,
		onCreateIncident
	} = $props();
</script>

<div class="incidents-grid">
	{#each items as incident}
		<IncidentCard 
			{incident} 
			{statusOptions}
			{onStatusUpdate}
			{onSelectForAI}
			{onArchive}
		/>
	{/each}

	{#if items.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📋</div>
			<h3>No incidents found</h3>
			<p>Create your first incident to get started</p>
			<Button class="empty-cta" onclick={onCreateIncident}>Create Incident</Button>
		</div>
	{/if}
</div>

<style>
	.incidents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	/* Empty State */
	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4));
		border: 2px dashed rgba(148, 163, 184, 0.3);
		border-radius: 2rem;
		backdrop-filter: blur(10px);
		transition: background 0.3s ease, border-color 0.3s ease;
	}
	
	:global(html.light) .empty-state {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.6), rgba(241, 245, 249, 0.4));
		border: 2px dashed rgba(148, 163, 184, 0.4);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.6;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 0.5rem;
		transition: color 0.3s ease;
	}

	.empty-state p {
		color: var(--maritime-text-muted, #94a3b8);
		margin: 0 0 2rem;
		transition: color 0.3s ease;
	}

	@media (max-width: 768px) {
		.incidents-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
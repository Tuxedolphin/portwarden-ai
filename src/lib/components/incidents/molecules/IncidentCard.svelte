<script>
	import { Button, Select, Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui';
	import IncidentTag from '../atoms/IncidentTag.svelte';

	let { incident, statusOptions, onStatusUpdate, onSelectForAI, onArchive } = $props();
</script>

<Card class="incident-card">
	<CardHeader class="incident-header">
		<div class="incident-id">
			{#if incident.caseCode}
				{incident.caseCode}
			{:else}
				#{incident.id}
			{/if}
		</div>
		<div class="status-dropdown">
			<Select
				variant="status"
				size="sm"
				value={incident.status}
				statusValue={incident.status}
				options={statusOptions}
				onchange={(/** @type {CustomEvent} */ e) => onStatusUpdate(incident.id, e.detail)}
				class="status-select"
			/>
		</div>
	</CardHeader>

	<CardContent class="incident-body">
		<h3 class="incident-title">{incident.title}</h3>
		<p class="incident-description">{incident.description}</p>

		{#if incident.tags && incident.tags.length > 0}
			<div class="tag-cloud">
				{#each incident.tags as tag}
					<IncidentTag {tag} />
				{/each}
			</div>
		{/if}
	</CardContent>

	<CardFooter class="incident-footer">
		<div class="incident-meta">
			<span class="created-date">
				Created {new Date(incident.created_at).toLocaleDateString()}
			</span>
		</div>
		<div class="incident-actions">
			<Button variant="secondary" size="sm" onclick={() => onSelectForAI(incident)}>Ask AI</Button>
			<Button variant="outline" size="sm" onclick={() => onArchive(incident.id)}>Archive</Button>
		</div>
	</CardFooter>
</Card>

<style>
	.incident-id {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		color: #94a3b8;
		font-weight: 600;
	}

	.incident-title {
		font-size: 1.3rem;
		font-weight: 700;
		color: #f8fafc;
		margin: 0 0 1rem;
		line-height: 1.4;
	}

	.incident-description {
		color: #cbd5e1;
		margin: 0 0 1rem;
		line-height: 1.6;
	}

	.tag-cloud {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.incident-meta {
		font-size: 0.85rem;
		color: #94a3b8;
	}

	.incident-actions {
		display: flex;
		gap: 0.75rem;
	}

	@media (max-width: 768px) {
		.incident-actions {
			flex-direction: column;
		}
	}
</style>

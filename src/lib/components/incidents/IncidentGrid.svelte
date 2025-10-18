<script>
	import { createEventDispatcher } from 'svelte';
	import { formatDate } from '$lib/utils/datetime';

	/**
	 * @typedef {import('$lib/types/incident').IncidentSummary} Incident
	 * @typedef {import('$lib/types/incident').IncidentStatus} IncidentStatus
	 */

	/** @type {Incident[]} */
	export let incidents = [];
	export let loading = false;
	/** @type {Record<IncidentStatus, string>} */
	export let statusLabels = {
		open: 'Open',
		'in-progress': 'In Progress',
		resolved: 'Resolved'
	};
	/** @type {IncidentStatus[]} */
	export let statusOptions = ['open', 'in-progress', 'resolved'];

	const dispatch = createEventDispatcher();

	/**
	 * @param {Incident['id']} incidentId
	 * @param {Event} event
	 */
	function handleStatusChange(incidentId, event) {
		const target = /** @type {HTMLSelectElement} */ (event.currentTarget);
		const value = /** @type {IncidentStatus} */ (target.value);
		dispatch('statuschange', { incidentId, status: value });
	}

	/** @param {Incident['id']} incidentId */
	function handleArchive(incidentId) {
		dispatch('archive', { incidentId });
	}

	/** @param {Incident} incident */
	function handleOpenAi(incident) {
		dispatch('ai', { incident });
	}
</script>

<section class="incident-grid">
	{#if loading}
		{#each Array.from({ length: 3 }) as _, index}
			<article
				class="incident-card incident-card--loading"
				aria-busy="true"
				aria-label={`Loading incident ${index + 1}`}
			></article>
		{/each}
	{:else if incidents.length === 0}
		<article class="incident-grid__empty surface-muted">
			<h2>No incidents yet</h2>
			<p>Log your first incident to begin tracking operational health.</p>
			<button class="button-primary" type="button" on:click={() => dispatch('create')}
				>Log incident</button
			>
		</article>
	{:else}
		{#each incidents as incident (incident.id)}
			<article class="incident-card surface-card">
				<header class="incident-card__header">
					<span class={`incident-card__badge ${incident.status}`}>
						{statusLabels[incident.status] ?? incident.status}
					</span>
					<select
						class="incident-card__select"
						bind:value={incident.status}
						on:change={(event) => handleStatusChange(incident.id, event)}
					>
						{#each statusOptions as status}
							<option value={status}>{statusLabels[status]}</option>
						{/each}
					</select>
				</header>

				<h3>{incident.title}</h3>
				<p>{incident.description}</p>

				{#if incident.tags?.length}
					<ul class="incident-card__tags">
						{#each incident.tags as tag}
							<li>{tag}</li>
						{/each}
					</ul>
				{/if}

				<footer class="incident-card__footer">
					<div class="incident-card__meta">
						<span>#{incident.id}</span>
						<span>Created {formatDate(incident.created_at)}</span>
					</div>
					<div class="incident-card__actions">
						<button
							class="button-secondary"
							type="button"
							on:click={() => handleArchive(incident.id)}
						>
							Archive
						</button>
						<button class="button-primary" type="button" on:click={() => handleOpenAi(incident)}>
							Ask ChatGPT 5 Mini
						</button>
					</div>
				</footer>
			</article>
		{/each}
	{/if}
</section>

<style src="./IncidentGrid.css"></style>

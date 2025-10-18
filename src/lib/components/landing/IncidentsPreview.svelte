<script>
	import { formatTimestamp } from '$lib/utils/datetime';
	import { toSeverityClass } from '$lib/utils/severity';

	/**
	 * @typedef {import('$lib/data/incidents').Incident} Incident
	 */

	/** @type {Incident[]} */
	export let incidents = [];

	$: previewIncidents = incidents.slice(0, 5);
</script>

<section class="section section--incidents">
	<div class="container incidents__layout">
		<div class="incidents__summary surface-card">
			<header class="incidents__summary-head">
				<div>
					<span class="badge">Live incidents</span>
					<h3>Operational picture</h3>
				</div>
				<a href="/incidents" class="link-view">View console →</a>
			</header>
			<ul class="incidents__list">
				{#each previewIncidents as incident}
					<li class="incidents__item surface-muted">
						<div class="incidents__item-head">
							<span class="incidents__id">{incident.displayId}</span>
							<span class={`badge ${toSeverityClass(incident.severity)}`}>{incident.severity}</span>
						</div>
						<h4>{incident.title}</h4>
						<p>{incident.summary}</p>
						<div class="incidents__meta">
							<span>{formatTimestamp(incident.occurredAt) || 'Just now'}</span>
							<span>{incident.channel || 'Port Authority Dispatch'}</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<div class="incidents__board surface-card">
			<header class="incidents__board-head">
				<h3>Port command briefing</h3>
				<span class="status-pill">
					<span class="status-pill__dot"></span>
					AI copilots assisting
				</span>
			</header>
			<div class="incidents__board-grid">
				<div class="board-stat">
					<span class="board-stat__label">Active vessels</span>
					<span class="board-stat__value">47</span>
					<span class="board-stat__hint">3 arrival adjustments today</span>
				</div>
				<div class="board-stat">
					<span class="board-stat__label">Cargo throughput</span>
					<span class="board-stat__value">12.4K</span>
					<span class="board-stat__hint">TEU processed in last 24h</span>
				</div>
				<div class="board-stat">
					<span class="board-stat__label">System health</span>
					<span class="board-stat__value">98.7%</span>
					<span class="board-stat__hint">Redundant nodes online</span>
				</div>
				<div class="board-stat">
					<span class="board-stat__label">Incident cadence</span>
					<span class="board-stat__value">11</span>
					<span class="board-stat__hint">Resolved in last week</span>
				</div>
			</div>
			<div class="incidents__actions">
				<a href="/incidents" class="button-primary">Manage incidents</a>
				<a href="/archive" class="button-secondary">Review archive</a>
				<button type="button" class="button-secondary button-secondary--ghost">
					Generate AI report
				</button>
			</div>
		</div>
	</div>
</section>

<style src="./IncidentsPreview.css"></style>

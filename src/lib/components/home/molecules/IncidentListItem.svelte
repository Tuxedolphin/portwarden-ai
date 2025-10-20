<script>
	let { incident, formatTimestamp, safeSeverity } = $props();
</script>

<div class="incident-item">
	<div class="incident-header">
		<span class="incident-id">{incident.displayId}</span>
		<span class="severity-badge {safeSeverity(incident.severity)}">{incident.severity}</span>
	</div>
	<h4 class="incident-title">{incident.title}</h4>
	<p class="incident-summary">{incident.summary}</p>
	<div class="incident-meta">
		<span>🕐 {formatTimestamp(incident.occurredAt) || 'Just now'}</span>
		<span>📍 {incident.channel || 'Port Authority'}</span>
	</div>
</div>

<style>
	.incident-item {
		width: 100%;
		text-align: left;
		padding: 1.5rem;
		border: 1px solid var(--maritime-border);
		border-radius: 1.5rem;
		background: var(--maritime-gradient-surface);
		color: var(--maritime-text-primary);
		cursor: pointer;
		transition: all 0.3s ease;
		font: inherit;
	}

	.incident-item:hover {
		transform: translateY(-3px);
		border-color: var(--maritime-border-hover);
		box-shadow: 0 20px 40px -15px rgba(96, 165, 250, 0.2);
	}

	:global(html.light) .incident-item {
		background: rgba(255, 255, 255, 0.95);
		border: 1px solid rgba(148, 163, 184, 0.35);
		box-shadow: 0 12px 30px -18px rgba(15, 23, 42, 0.2);
		color: #0f172a;
	}

	.incident-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.incident-id {
		font-size: 0.85rem;
		color: var(--maritime-text-muted);
		font-family: 'JetBrains Mono', monospace;
	}

	.severity-badge {
		padding: 0.3rem 0.8rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.severity-badge.critical {
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		color: white !important; /* White text on red background for all themes */
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
		transition: color 0.3s ease;
	}

	.severity-badge.high {
		background: linear-gradient(135deg, #ea580c, #c2410c);
		color: white !important; /* White text on orange background for all themes */
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
		transition: color 0.3s ease;
	}

	.severity-badge.medium {
		background: linear-gradient(135deg, #ca8a04, #a16207);
		color: white;
		box-shadow: 0 4px 15px rgba(202, 138, 4, 0.3);
	}

	.severity-badge.low {
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: white !important; /* White text on green background for all themes */
		box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
	}

	.incident-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--maritime-text-primary);
		margin: 0 0 0.5rem;
	}

	:global(html.light) .incident-title {
		color: #0f172a;
	}

	.incident-summary {
		font-size: 0.9rem;
		color: var(--maritime-text-secondary);
		margin: 0 0 1rem;
		line-height: 1.4;
	}

	:global(html.light) .incident-summary {
		color: #1f2937;
	}

	.incident-meta {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		font-size: 0.9rem;
		color: var(--maritime-text-muted);
	}

	:global(html.light) .incident-meta {
		color: #475569;
	}

	.incident-meta span {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
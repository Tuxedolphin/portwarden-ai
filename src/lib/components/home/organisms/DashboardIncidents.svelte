<script>
	import IncidentListItem from '../molecules/IncidentListItem.svelte';
	
	let { incidents, formatTimestamp, safeSeverity } = $props();
</script>

<section class="dashboard-incidents">
	<div class="incidents-content">
		<div class="dashboard-grid">
			<div class="incident-sidebar theme-card">
				<div class="panel-header">
					<h3>Live Incidents</h3>
					<span class="incident-count">{incidents.length} Active</span>
				</div>

				<div class="incident-list-items">
					{#each incidents.slice(0, 5) as incident}
						<IncidentListItem {incident} {formatTimestamp} {safeSeverity} />
					{/each}
				</div>

				<a href="/incidents" class="view-all-btn">View All Incidents →</a>
			</div>

			<div class="incident-detail-panel theme-card">
				<div class="panel-header">
					<h3>Port Operations Overview</h3>
					<div class="status-indicator online">System Online</div>
				</div>

				<div class="operations-overview">
					<div class="overview-grid">
						<div class="overview-stat theme-card">
							<h4>Active Vessels</h4>
							<span class="overview-value">47</span>
							<span class="overview-trend">+3 today</span>
						</div>
						<div class="overview-stat theme-card">
							<h4>Cargo Throughput</h4>
							<span class="overview-value">12.4K</span>
							<span class="overview-trend">TEU today</span>
						</div>
						<div class="overview-stat theme-card">
							<h4>System Health</h4>
							<span class="overview-value">98.7%</span>
							<span class="overview-trend">Uptime</span>
						</div>
						<div class="overview-stat theme-card">
							<h4>Response Time</h4>
							<span class="overview-value">&lt;2min</span>
							<span class="overview-trend">Average</span>
						</div>
					</div>

					<div class="next-actions">
						<h4>Quick Actions</h4>
						<div class="action-grid">
							<a href="/incidents" class="quick-action theme-card">Manage Incidents</a>
							<a href="/archive" class="quick-action theme-card">View Archive</a>
							<button class="quick-action theme-card">Generate Report</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.dashboard-incidents {
		padding: 2rem;
		background: transparent;
		position: relative;
	}

	.incidents-content {
		position: relative;
		z-index: 2;
		max-width: 1400px;
		margin: 0 auto;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 400px 1fr;
		gap: 3rem;
	}

	.incident-sidebar {
		background: var(--maritime-gradient-surface);
		border: 1px solid var(--maritime-border);
		border-radius: 2rem;
		padding: 2rem;
		backdrop-filter: blur(10px);
		height: fit-content;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 25px 50px -12px var(--maritime-shadow);
	}

	:global(html.light) .incident-sidebar {
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.85));
		border: 1px solid rgba(148, 163, 184, 0.35);
		box-shadow: 0 25px 50px -20px rgba(15, 23, 42, 0.15);
	}

	.incident-list-items {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.incident-detail-panel {
		background: var(--maritime-gradient-surface);
		border: 1px solid var(--maritime-border);
		border-radius: 2rem;
		padding: 2.5rem;
		backdrop-filter: blur(10px);
		box-shadow: 0 25px 50px -12px var(--maritime-shadow);
	}

	:global(html.light) .incident-detail-panel {
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.9));
		border: 1px solid rgba(148, 163, 184, 0.35);
		box-shadow: 0 25px 50px -20px rgba(15, 23, 42, 0.12);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--maritime-border);
		gap: 1rem;
	}

	.panel-header h3 {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--maritime-text-primary);
		margin: 0;
		flex: 1;
		min-width: 0;
	}

	:global(html.light) .panel-header h3 {
		color: #0f172a;
	}

	.incident-count {
		background: rgba(59, 130, 246, 0.16);
		color: var(--maritime-accent-light);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.85rem;
		font-weight: 500;
	}

	:global(html.light) .incident-count {
		color: #1d4ed8;
	}

	.status-indicator.online {
		background: rgba(34, 197, 94, 0.18);
		color: #16a34a;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.85rem;
		font-weight: 500;
		white-space: nowrap;
		flex-shrink: 0;
	}

	:global(html.light) .status-indicator.online {
		color: #166534;
	}

	.view-all-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		color: white;
		text-decoration: none;
		border-radius: 0.75rem;
		font-weight: 600;
		text-align: center;
		margin-top: 1.5rem;
		transition: all 0.3s ease;
	}

	.view-all-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 20px 40px -15px rgba(59, 130, 246, 0.4);
	}

	.operations-overview {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.overview-stat {
		text-align: center;
		padding: 1rem;
		border-radius: 1rem;
		border: 1px solid var(--maritime-border);
		transition: all 0.3s ease;
	}

	:global(html.light) .overview-stat {
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid rgba(148, 163, 184, 0.35);
		box-shadow: 0 10px 30px -15px rgba(15, 23, 42, 0.15);
	}

	.overview-stat:hover {
		transform: translateY(-2px);
		background: var(--maritime-gradient-surface-hover);
	}

	.overview-stat h4 {
		font-size: 0.9rem;
		color: var(--maritime-text-muted);
		margin: 0 0 0.5rem;
		font-weight: 500;
	}

	:global(html.light) .overview-stat h4 {
		color: #475569;
	}

	.overview-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--maritime-accent);
		display: block;
		margin-bottom: 0.25rem;
	}

	:global(html.light) .overview-value {
		color: #1d4ed8;
	}

	.overview-trend {
		font-size: 0.8rem;
		color: #22c55e;
		font-weight: 500;
	}

	:global(html.light) .overview-trend {
		color: #15803d;
	}

	.next-actions h4 {
		color: var(--maritime-text-primary);
		margin: 0 0 1rem;
		font-size: 1rem;
	}

	:global(html.light) .next-actions h4 {
		color: #0f172a;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.quick-action {
		padding: 0.75rem 1rem;
		border: 1px solid var(--maritime-border);
		color: var(--maritime-text-secondary);
		border-radius: 0.75rem;
		text-decoration: none;
		transition: all 0.3s ease;
		font-weight: 500;
		text-align: center;
		font-size: 0.85rem;
		cursor: pointer;
	}

	:global(html.light) .quick-action {
		background: rgba(255, 255, 255, 0.95);
		color: #1e293b;
	}

	:global(html.light) .quick-action {
		background: rgba(255, 255, 255, 0.95);
		color: #1e293b;
	}

	.quick-action:hover {
		background: var(--maritime-gradient-button);
		color: #fff;
		transform: translateY(-2px);
		box-shadow: 0 10px 25px -10px rgba(59, 130, 246, 0.4);
	}

	/* Scrollbar Styling */
	.incident-sidebar::-webkit-scrollbar {
		width: 6px;
	}

	.incident-sidebar::-webkit-scrollbar-track {
		background: rgba(148, 163, 184, 0.1);
		border-radius: 3px;
	}

	.incident-sidebar::-webkit-scrollbar-thumb {
		background: rgba(96, 165, 250, 0.5);
		border-radius: 3px;
	}

	.incident-sidebar::-webkit-scrollbar-thumb:hover {
		background: rgba(96, 165, 250, 0.7);
	}

	@media (max-width: 1200px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.incident-sidebar {
			max-height: 500px;
		}
	}

	@media (max-width: 768px) {
		.dashboard-incidents {
			padding: 1rem;
		}

		.panel-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.panel-header h3 {
			font-size: 1.1rem;
		}

		.status-indicator.online {
			align-self: flex-end;
		}

		.overview-grid {
			grid-template-columns: 1fr;
		}

		.action-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
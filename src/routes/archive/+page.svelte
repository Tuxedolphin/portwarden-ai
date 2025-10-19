<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	/** @type {Array<any>} */
	let items = [];
	let total = 0;
	let page = 1;
	let pageSize = 10;
	let q = '';
	let tagInput = '';

	async function load() {
		const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
		if (q) params.set('q', q);
		if (tagInput) params.set('tags', tagInput);
		const res = await fetch(`/api/archive?${params.toString()}`);
		const data = await res.json();
		items = data.results || [];
		total = data.total || 0;
	}
	onMount(load);
</script>

<Header />

<!-- Hero Header Section -->
<section class="hero-header">
	<div class="hero-content">
		<div class="hero-text">
			<h1>Incident Archive</h1>
			<p class="hero-subtitle">Historical record of resolved and closed port incidents</p>
		</div>

		<!-- Search and Filter Controls -->
		<div class="filter-panel">
			<div class="search-group">
				<input
					type="text"
					placeholder="Search archived incidents..."
					bind:value={q}
					class="search-input"
				/>
				<input
					type="text"
					placeholder="Filter by tags..."
					bind:value={tagInput}
					class="tag-input"
				/>
				<button class="search-btn" on:click={load}>
					<span class="search-icon">🔍</span>
					Search
				</button>
			</div>
		</div>
	</div>

	<!-- Archive Statistics -->
	<div class="archive-stats">
		<div class="stat-card">
			<span class="stat-value">{total}</span>
			<span class="stat-label">Total Archived</span>
		</div>
		<div class="stat-card">
			<span class="stat-value"
				>{items.filter(
					(i) => new Date(i.archived_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
				).length}</span
			>
			<span class="stat-label">This Week</span>
		</div>
		<div class="stat-card">
			<span class="stat-value"
				>{items.filter(
					(i) => new Date(i.archived_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
				).length}</span
			>
			<span class="stat-label">This Month</span>
		</div>
	</div>
</section>

<!-- Archive Content -->
<section class="archive-content">
	<div class="archive-grid">
		{#each items as incident}
			<article class="archive-card">
				<header class="archive-header">
					<div class="incident-info">
						<span class="incident-id">#{incident.id}</span>
						<span class="archive-date">{new Date(incident.archived_at).toLocaleDateString()}</span>
					</div>
					<div class="status-badge archived">Archived</div>
				</header>

				<div class="archive-body">
					<h3 class="archive-title">{incident.title}</h3>
					<p class="archive-summary">{incident.summary}</p>

					{#if incident.tags && incident.tags.length > 0}
						<div class="tag-list">
							{#each incident.tags as tag}
								<span class="archive-tag">{tag.name}</span>
							{/each}
						</div>
					{/if}
				</div>

				<footer class="archive-footer">
					<div class="timeline-info">
						<span class="timeline-label">Archived:</span>
						<span class="timeline-value">{new Date(incident.archived_at).toLocaleString()}</span>
					</div>

					{#if incident.resolution_time}
						<div class="resolution-info">
							<span class="resolution-label">Resolution Time:</span>
							<span class="resolution-value">{incident.resolution_time}</span>
						</div>
					{/if}
				</footer>
			</article>
		{/each}

		{#if items.length === 0}
			<div class="empty-archive">
				<div class="empty-icon">📁</div>
				<h3>No archived incidents found</h3>
				{#if q || tagInput}
					<p>No results match your search criteria</p>
					<button
						class="clear-search"
						on:click={() => {
							q = '';
							tagInput = '';
							load();
						}}
					>
						Clear Search
					</button>
				{:else}
					<p>Archive incidents to see them here</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if total > pageSize}
		<div class="pagination">
			<button
				class="page-btn"
				disabled={page <= 1}
				on:click={() => {
					page--;
					load();
				}}
			>
				Previous
			</button>
			<span class="page-info">
				Page {page} of {Math.ceil(total / pageSize)} • Showing {items.length} of {total} incidents
			</span>
			<button
				class="page-btn"
				disabled={page >= Math.ceil(total / pageSize)}
				on:click={() => {
					page++;
					load();
				}}
			>
				Next
			</button>
		</div>
	{/if}
</section>

<style>
	/* Hero Header Section */
	.hero-header {
		position: relative;
		background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
		padding: 3rem 2rem 2rem;
		margin-bottom: 3rem;
		overflow: hidden;
		transition: background 0.3s ease, border-color 0.3s ease;
	}
	
	:global(html.light) .hero-header {
		background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%);
		border-bottom: 1px solid rgba(148, 163, 184, 0.3);
	}

	.hero-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('/images/tuasport.jpg') center/cover no-repeat;
		opacity: 0.1;
		z-index: 1;
	}

	.hero-content {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
		margin-bottom: 3rem;
	}

	.hero-text h1 {
		font-size: 3rem;
		font-weight: 800;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 0.5rem;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		transition: color 0.3s ease;
	}
	
	/* Force light theme color for archive title */
	:global(html.light) .hero-text h1 {
		color: #0f172a !important;
		text-shadow: 0 2px 10px rgba(255, 255, 255, 0.8);
	}

	.hero-subtitle {
		font-size: 1.2rem;
		color: var(--maritime-text-muted, #94a3b8);
		margin: 0 0 2rem;
		font-weight: 300;
		transition: color 0.3s ease;
	}

	.filter-panel {
		background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1.5rem;
		padding: 2rem;
		backdrop-filter: blur(10px);
		transition: background 0.3s ease, border-color 0.3s ease;
	}
	
	:global(html.light) .filter-panel {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.3);
	}

	.search-group {
		display: grid;
		grid-template-columns: 2fr 1fr auto;
		gap: 1rem;
		align-items: center;
	}

	.search-input,
	.tag-input {
		padding: 1rem 1.5rem;
		border: 1px solid rgba(148, 163, 184, 0.3);
		border-radius: 1rem;
		background: rgba(15, 23, 42, 0.8);
		color: var(--maritime-text-secondary, #e2e8f0);
		font-size: 1rem;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
	}
	
	:global(html.light) .search-input,
	:global(html.light) .tag-input {
		background: rgba(248, 250, 252, 0.8);
		color: var(--maritime-text-primary, #0f172a);
		border-color: rgba(148, 163, 184, 0.4);
	}

	.search-input:focus,
	.tag-input:focus {
		outline: none;
		border-color: var(--maritime-accent, rgba(59, 130, 246, 0.6));
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.search-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background: linear-gradient(135deg, var(--maritime-accent, #3b82f6), var(--maritime-accent-secondary, #1d4ed8));
		color: white !important; /* Button text should remain white on blue background */
		border: none;
		border-radius: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		white-space: nowrap;
	}

	.search-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px -10px rgba(59, 130, 246, 0.4);
	}

	.search-icon {
		font-size: 1rem;
	}

	.archive-stats {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		text-align: center;
		padding: 2rem;
		background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1.5rem;
		backdrop-filter: blur(10px);
		transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
	}
	
	:global(html.light) .stat-card {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.3);
	}

	.stat-card:hover {
		transform: translateY(-3px);
	}

	.stat-value {
		display: block;
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--maritime-accent, #60a5fa);
		text-shadow: 0 2px 10px rgba(96, 165, 250, 0.3);
		margin-bottom: 0.5rem;
		transition: color 0.3s ease;
	}

	.stat-label {
		display: block;
		font-size: 0.9rem;
		color: var(--maritime-text-muted, #94a3b8);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		transition: color 0.3s ease;
	}

	/* Archive Content */
	.archive-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem 4rem;
		/* Remove explicit background to inherit from body */
		transition: background 0.3s ease;
		min-height: 60vh;
	}

	.archive-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.archive-card {
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1.5rem;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
	}
	
	:global(html.light) .archive-card {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.3);
		box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
	}

	.archive-card:hover {
		transform: translateY(-5px);
		border-color: rgba(96, 165, 250, 0.4);
		box-shadow: 0 20px 50px -10px rgba(96, 165, 250, 0.2);
	}
	
	:global(html.light) .archive-card:hover {
		box-shadow: 0 20px 50px -10px rgba(96, 165, 250, 0.15);
	}

	.archive-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 1.5rem 0;
	}

	.incident-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.incident-id {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		color: var(--maritime-text-muted, #94a3b8);
		font-weight: 600;
		transition: color 0.3s ease;
	}

	.archive-date {
		font-size: 0.8rem;
		color: var(--maritime-text-muted, #64748b);
		transition: color 0.3s ease;
	}

	.status-badge {
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
	}

	.status-badge.archived {
		background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(100, 116, 139, 0.1));
		color: var(--maritime-text-muted, #cbd5e1);
		border: 1px solid rgba(148, 163, 184, 0.3);
	}
	
	:global(html.light) .status-badge.archived {
		background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(100, 116, 139, 0.2));
		color: var(--maritime-text-primary, #1e293b);
		border: 1px solid rgba(148, 163, 184, 0.4);
	}

	.archive-body {
		padding: 1.5rem;
	}

	.archive-title {
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 1rem;
		line-height: 1.4;
		transition: color 0.3s ease;
	}

	.archive-summary {
		color: var(--maritime-text-secondary, #cbd5e1);
		margin: 0 0 1rem;
		line-height: 1.6;
		transition: color 0.3s ease;
	}

	.tag-list {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.archive-tag {
		padding: 0.3rem 0.8rem;
		background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(100, 116, 139, 0.1));
		color: var(--maritime-text-secondary, #cbd5e1);
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 500;
		border: 1px solid rgba(148, 163, 184, 0.3);
		transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
	}
	
	:global(html.light) .archive-tag {
		background: linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(100, 116, 139, 0.2));
		color: var(--maritime-text-primary, #1e293b);
		border: 1px solid rgba(148, 163, 184, 0.4);
	}

	.archive-footer {
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid rgba(148, 163, 184, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: border-color 0.3s ease;
	}
	
	:global(html.light) .archive-footer {
		border-top: 1px solid rgba(148, 163, 184, 0.2);
	}

	.timeline-info,
	.resolution-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
	}

	.timeline-label,
	.resolution-label {
		color: var(--maritime-text-muted, #94a3b8);
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.timeline-value,
	.resolution-value {
		color: var(--maritime-text-secondary, #e2e8f0);
		font-family: 'JetBrains Mono', monospace;
		transition: color 0.3s ease;
	}

	/* Empty State */
	.empty-archive {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4));
		border: 2px dashed rgba(148, 163, 184, 0.3);
		border-radius: 2rem;
		backdrop-filter: blur(10px);
		transition: background 0.3s ease, border-color 0.3s ease;
	}
	
	:global(html.light) .empty-archive {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.6), rgba(241, 245, 249, 0.4));
		border: 2px dashed rgba(148, 163, 184, 0.4);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.6;
		color: var(--maritime-text-muted, #94a3b8);
		transition: color 0.3s ease;
	}

	.empty-archive h3 {
		font-size: 1.5rem;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 0.5rem;
		transition: color 0.3s ease;
	}

	.empty-archive p {
		color: var(--maritime-text-muted, #94a3b8);
		transition: color 0.3s ease;
		margin: 0 0 2rem;
	}

	.clear-search {
		padding: 1rem 2rem;
		background: linear-gradient(135deg, var(--maritime-text-muted, #6b7280), #4b5563);
		color: white !important; /* Button text should remain white on gray background */
		border: none;
		border-radius: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.clear-search:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 30px -10px rgba(107, 114, 128, 0.4);
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 2rem 0;
	}

	.page-btn {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6));
		color: var(--maritime-text-primary, #e2e8f0);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}
	
	:global(html.light) .page-btn {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6));
		color: var(--maritime-text-primary, #0f172a);
		border: 1px solid rgba(148, 163, 184, 0.3);
	}

	.page-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		border-color: rgba(59, 130, 246, 0.4);
		transform: translateY(-1px);
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-info {
		color: var(--maritime-text-muted, #94a3b8);
		font-weight: 500;
		text-align: center;
		min-width: 200px;
		transition: color 0.3s ease;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.search-group {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.archive-stats {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.hero-text h1 {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}

		.filter-panel {
			padding: 1.5rem;
		}

		.archive-stats {
			grid-template-columns: 1fr;
		}

		.archive-grid {
			grid-template-columns: 1fr;
		}

		.stat-card {
			padding: 1.5rem;
		}

		.archive-footer {
			padding: 1rem;
		}

		.pagination {
			flex-direction: column;
			gap: 1rem;
		}

		.page-info {
			order: -1;
			text-align: center;
		}
	}

	@media (max-width: 480px) {
		.hero-header {
			padding: 2rem 1rem 1rem;
		}

		.archive-content {
			padding: 0 1rem 2rem;
		}

		.incident-info {
			gap: 0.1rem;
		}

		.archive-body {
			padding: 1rem;
		}

		.timeline-info,
		.resolution-info {
			flex-direction: column;
			gap: 0.25rem;
			align-items: flex-start;
		}
	}
</style>

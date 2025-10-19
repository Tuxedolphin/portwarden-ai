<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	import { translateError } from '$lib/errorTranslator';
	import { Button, Badge, Select, Avatar, Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui';

	/** @type {Array<any>} */
	let items = [];
	let total = 0;
	let page = 1;
	let pageSize = 10;
	let showCreate = false;
	let title = '';
	let description = '';
	let tags = '';
	let toast = '';

	// AI Co-pilot state
	/** @type {any | null} */
	let selectedIncident = null;
	let playbookOutput = '';
	let escalationOutput = '';
	let playbookLoading = false;
	let escalationLoading = false;
	let showAiPanel = false;
	/** @type {{ title?: string, message?: string, code?: string, steps?: string[], detailsPages?: string[] } | null} */
	let errorObj = null;

	// Status options for Select component
	const statusOptions = [
		{ value: "open", label: "Open" },
		{ value: "in-progress", label: "In Progress" },
		{ value: "resolved", label: "Resolved" }
	];

	async function load() {
		const res = await fetch(`/api/incidents?page=${page}&pageSize=${pageSize}`);
		const data = await res.json();
		items = data.results || [];
		total = data.total || 0;
	}

	async function createIncident() {
		toast = '';
		try {
			const res = await fetch('/api/incidents', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description,
					tags: tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || 'Failed to create incident');
			showCreate = false;
			title = '';
			description = '';
			tags = '';
			await load();
		} catch (e) {
			toast = e instanceof Error ? e.message : 'Create failed';
		}
	}

	/** @param {number} id */
	async function archive(id) {
		const res = await fetch(`/api/incidents/${id}/archive`, { method: 'POST' });
		if (!res.ok) {
			toast = 'Archive failed';
			return;
		}
		await load();
	}

	/** @param {number} id @param {string} newStatus */
	async function updateStatus(id, newStatus) {
		toast = '';
		try {
			const res = await fetch(`/api/incidents/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error?.error || 'Failed to update status');
			}
			await load();
		} catch (e) {
			toast = e instanceof Error ? e.message : 'Update failed';
		}
	}

	/** @param {any} incident */
	function selectIncidentForAI(incident) {
		selectedIncident = incident;
		playbookOutput = '';
		escalationOutput = '';
		errorObj = null;
		showAiPanel = true;
	}

	/** @param {'playbook'|'escalation'} intent */
	async function requestGpt5(intent) {
		if (!selectedIncident) return;
		errorObj = null;
		try {
			if (intent === 'playbook') {
				playbookLoading = true;
			} else {
				escalationLoading = true;
			}

			const response = await fetch('/api/gpt5', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ incidentId: selectedIncident.id, intent })
			});

			const payload = await response.json();

			if (!response.ok) {
				const err = { status: response.status, payload: payload, url: '/api/gpt5' };
				throw err;
			}

			if (intent === 'playbook') {
				playbookOutput = payload.output;
			} else {
				escalationOutput = payload.output;
			}
		} catch (error) {
			errorObj = translateError(
				error instanceof Error ? { message: error.message, stack: error.stack } : error
			);
		} finally {
			playbookLoading = false;
			escalationLoading = false;
		}
	}

	onMount(load);
</script>

<Header />

<!-- Hero Header Section -->
<section class="hero-header">
	<div class="hero-content">
		<div class="hero-text">
			<h1>Incident Management</h1>
			<p class="hero-subtitle">Monitor and resolve port operations incidents in real-time</p>
		</div>
		<Button class="new-incident-btn" onclick={() => (showCreate = true)}>
			<span class="btn-icon">+</span>
			New Incident
		</Button>
	</div>

	<!-- Statistics Bar -->
	<div class="stats-bar">
		<div class="stat-item">
			<span class="stat-value">{items.filter((i) => i.status === 'open').length}</span>
			<span class="stat-label">Open</span>
		</div>
		<div class="stat-item">
			<span class="stat-value">{items.filter((i) => i.status === 'in-progress').length}</span>
			<span class="stat-label">In Progress</span>
		</div>
		<div class="stat-item">
			<span class="stat-value">{items.filter((i) => i.status === 'resolved').length}</span>
			<span class="stat-label">Resolved</span>
		</div>
		<div class="stat-item">
			<span class="stat-value">{total}</span>
			<span class="stat-label">Total</span>
		</div>
	</div>
</section>

<!-- Main Content Section -->
<section class="incidents-content">
	{#if toast}
		<div class="toast">{toast}</div>
	{/if}

	<div class="incidents-grid">
		{#each items as incident}
			<Card class="incident-card">
				<CardHeader class="incident-header">
					<div class="incident-id">#{incident.id}</div>
					<div class="status-dropdown">
						<Select
							variant="status"
							size="sm"
							value={incident.status}
							statusValue={incident.status}
							options={statusOptions}
							onchange={(/** @type {CustomEvent} */ e) => updateStatus(incident.id, e.detail)}
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
								<Badge variant="secondary" class="incident-tag">{tag.name}</Badge>
							{/each}
						</div>
					{/if}
				</CardContent>

				<CardFooter class="incident-footer">
					<div class="incident-meta">
						<span class="created-date"
							>Created {new Date(incident.created_at).toLocaleDateString()}</span
						>
					</div>
					<div class="incident-actions">
						<Button variant="secondary" size="sm" onclick={() => selectIncidentForAI(incident)}>
							Ask AI
						</Button>
						<Button variant="outline" size="sm" onclick={() => archive(incident.id)}>
							Archive
						</Button>
					</div>
				</CardFooter>
			</Card>
		{/each}

		{#if items.length === 0}
			<div class="empty-state">
				<div class="empty-icon">📋</div>
				<h3>No incidents found</h3>
				<p>Create your first incident to get started</p>
				<Button class="empty-cta" onclick={() => (showCreate = true)}>Create Incident</Button>
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if total > pageSize}
		<div class="pagination">
			<Button
				variant="outline"
				disabled={page <= 1}
				onclick={() => {
					page--;
					load();
				}}
			>
				Previous
			</Button>
			<span class="page-info">
				Page {page} of {Math.ceil(total / pageSize)}
			</span>
			<Button
				variant="outline"
				disabled={page >= Math.ceil(total / pageSize)}
				onclick={() => {
					page++;
					load();
				}}
			>
				Next
			</Button>
		</div>
	{/if}
</section>

<!-- Create Incident Modal -->
{#if showCreate}
	<div class="modal-overlay">
		<div class="modal-container">
			<header class="modal-header">
				<h2>Create New Incident</h2>
				<button class="close-btn" onclick={() => (showCreate = false)}>×</button>
			</header>

			<form class="modal-form" onsubmit={/** @param {Event} e */ (e) => { e.preventDefault(); createIncident(); }}>
				<div class="form-group">
					<label for="title">Incident Title</label>
					<input
						id="title"
						type="text"
						bind:value={title}
						placeholder="Enter incident title"
						required
					/>
				</div>

				<div class="form-group">
					<label for="description">Description</label>
					<textarea
						id="description"
						bind:value={description}
						placeholder="Describe the incident in detail"
						rows="4"
						required
					></textarea>
				</div>

				<div class="form-group">
					<label for="tags">Tags</label>
					<input
						id="tags"
						type="text"
						bind:value={tags}
						placeholder="Enter tags separated by commas"
					/>
					<small class="form-hint">Separate multiple tags with commas</small>
				</div>

				<footer class="modal-footer">
					<Button variant="outline" type="button" onclick={() => (showCreate = false)}>
						Cancel
					</Button>
					<Button type="submit">Create Incident</Button>
				</footer>
			</form>
		</div>
	</div>
{/if}

<!-- AI Co-pilot Panel -->
{#if showAiPanel && selectedIncident}
	<div class="modal-overlay">
		<div class="ai-modal-container">
			<header class="ai-modal-header">
				<div>
					<h2>AI Co-pilot</h2>
					<p class="ai-incident-title">Analyzing: {selectedIncident.title}</p>
				</div>
				<button class="close-btn" onclick={() => (showAiPanel = false)}>×</button>
			</header>

			<div class="ai-modal-content">
				<div class="ai-interface">
					<Avatar variant="ai" size="xl" fallback="AI">
						🤖
					</Avatar>
					<div class="ai-welcome">
						<p>
							I'm ready to help you resolve incident <strong>#{selectedIncident.id}</strong>. I can
							generate remediation playbooks and escalation summaries based on the incident details.
						</p>
					</div>
				</div>

				<div class="ai-actions">
					<Button
						loading={playbookLoading}
						onclick={() => requestGpt5('playbook')}
					>
						📋 Generate Playbook
					</Button>
					<Button
						variant="secondary"
						loading={escalationLoading}
						onclick={() => requestGpt5('escalation')}
					>
						📤 Draft Escalation
					</Button>
				</div>

				{#if errorObj}
					<div class="ai-error">
						<ErrorViewer {errorObj} onRetry={() => requestGpt5('playbook')} />
					</div>
				{/if}

				<div class="ai-outputs">
					<div class="ai-output-section">
						<h3>Remediation Playbook</h3>
						{#if playbookOutput}
							<div class="ai-output-content">
								<pre><code>{playbookOutput}</code></pre>
							</div>
						{:else}
							<div class="ai-placeholder">
								<p>
									Click "Generate Playbook" to get AI-powered remediation steps for this incident.
								</p>
							</div>
						{/if}
					</div>

					<div class="ai-output-section">
						<h3>Escalation Summary</h3>
						{#if escalationOutput}
							<div class="ai-output-content">
								<pre><code>{escalationOutput}</code></pre>
							</div>
						{:else}
							<div class="ai-placeholder">
								<p>
									Click "Draft Escalation" to generate a summary for leadership and stakeholder
									communication.
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Hero Header Section */
	.hero-header {
		position: relative;
		background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
		padding: 3rem 2rem 2rem;
		margin-bottom: 3rem;
		overflow: hidden;
	}

	.hero-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('/images/wideangle.jpg') center/cover no-repeat;
		opacity: 0.1;
		z-index: 1;
	}

	.hero-content {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;
	}

	.hero-text h1 {
		font-size: 3rem;
		font-weight: 800;
		color: #f8fafc;
		margin: 0 0 0.5rem;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.hero-subtitle {
		font-size: 1.2rem;
		color: #94a3b8;
		margin: 0;
		font-weight: 300;
	}

	.stats-bar {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1.5rem;
	}

	.stat-item {
		text-align: center;
		padding: 1.5rem;
		background: light-dark(
			linear-gradient(145deg, rgba(248, 250, 252, 0.8), rgba(226, 232, 240, 0.6)),
			linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6))
		);
		border: 1px solid light-dark(rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2));
		border-radius: 1rem;
		backdrop-filter: blur(10px);
	}

	.stat-value {
		display: block;
		font-size: 2rem;
		font-weight: 800;
		color: light-dark(#3b82f6, #60a5fa);
		text-shadow: light-dark(0 2px 10px rgba(59, 130, 246, 0.2), 0 2px 10px rgba(96, 165, 250, 0.3));
	}

	.stat-label {
		display: block;
		font-size: 0.9rem;
		color: light-dark(#64748b, #94a3b8);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-top: 0.5rem;
	}

	/* Main Content */
	.incidents-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem 4rem;
	}

	.toast {
		padding: 1rem 1.5rem;
		border-radius: 1rem;
		background: light-dark(
			linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05)),
			linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))
		);
		border: 1px solid light-dark(rgba(248, 113, 113, 0.2), rgba(248, 113, 113, 0.3));
		color: light-dark(#dc2626, #fecaca);
		margin-bottom: 2rem;
		backdrop-filter: blur(10px);
	}

	.incidents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.incident-id {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9rem;
		color: light-dark(#64748b, #94a3b8);
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
		color: light-dark(#64748b, #94a3b8);
	}

	/* Empty State */
	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem 2rem;
		background: light-dark(
			linear-gradient(145deg, rgba(248, 250, 252, 0.6), rgba(226, 232, 240, 0.4)),
			linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4))
		);
		border: 2px dashed light-dark(rgba(148, 163, 184, 0.4), rgba(148, 163, 184, 0.3));
		border-radius: 2rem;
		backdrop-filter: blur(10px);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.6;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		color: light-dark(#1e293b, #f8fafc);
		margin: 0 0 0.5rem;
	}

	.empty-state p {
		color: light-dark(#64748b, #94a3b8);
		margin: 0 0 2rem;
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 2rem 0;
	}

	.page-info {
		color: light-dark(#64748b, #94a3b8);
		font-weight: 500;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(10px);
	}

	.modal-container {
		background: light-dark(
			linear-gradient(145deg, #f8fafc, #e2e8f0),
			linear-gradient(145deg, #0f172a, #1e293b)
		);
		border: 1px solid light-dark(rgba(148, 163, 184, 0.4), rgba(148, 163, 184, 0.3));
		border-radius: 1.5rem;
		width: min(90vw, 600px);
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid light-dark(rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2));
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: light-dark(#1e293b, #f8fafc);
		margin: 0;
	}

	.close-btn {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		background: light-dark(rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.2));
		color: light-dark(#64748b, #94a3b8);
		border-radius: 50%;
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: light-dark(rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.2));
		color: light-dark(#dc2626, #fecaca);
	}

	.modal-form {
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		color: light-dark(#374151, #e2e8f0);
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 1rem;
		border: 1px solid light-dark(rgba(148, 163, 184, 0.4), rgba(148, 163, 184, 0.3));
		border-radius: 0.75rem;
		background: light-dark(rgba(248, 250, 252, 0.8), rgba(15, 23, 42, 0.8));
		color: light-dark(#374151, #e2e8f0);
		font-size: 1rem;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: light-dark(rgba(59, 130, 246, 0.5), rgba(59, 130, 246, 0.6));
		box-shadow: 0 0 0 3px light-dark(rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.1));
	}

	.form-hint {
		display: block;
		font-size: 0.85rem;
		color: light-dark(#64748b, #94a3b8);
		margin-top: 0.25rem;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	/* AI Co-pilot Styles */
	.incident-actions {
		display: flex;
		gap: 0.75rem;
	}

	.ai-modal-container {
		background: light-dark(
			linear-gradient(145deg, rgba(248, 250, 252, 0.98), rgba(226, 232, 240, 0.95)),
			linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))
		);
		border: 1px solid light-dark(rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2));
		border-radius: 2rem;
		max-width: 1000px;
		width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
		backdrop-filter: blur(20px);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	.ai-modal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid light-dark(rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2));
	}

	.ai-modal-header h2 {
		font-size: 1.8rem;
		font-weight: 700;
		color: light-dark(#1e293b, #f8fafc);
		margin: 0 0 0.5rem;
	}

	.ai-incident-title {
		color: light-dark(#64748b, #94a3b8);
		margin: 0;
		font-size: 1rem;
	}

	.ai-modal-content {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.ai-interface {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
		padding: 1.5rem;
		background: light-dark(
			rgba(226, 232, 240, 0.6),
			rgba(30, 41, 59, 0.6)
		);
		border-radius: 1.5rem;
		border: 1px solid light-dark(rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2));
	}

	.ai-welcome {
		flex: 1;
	}

	.ai-welcome p {
		color: light-dark(#475569, #cbd5e1);
		line-height: 1.6;
		margin: 0;
		font-size: 1.1rem;
	}

	.ai-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.ai-error {
		background: light-dark(
			rgba(239, 68, 68, 0.05),
			rgba(239, 68, 68, 0.1)
		);
		border: 1px solid light-dark(rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.3));
		border-radius: 1rem;
		padding: 1rem;
	}

	.ai-outputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.ai-output-section {
		background: light-dark(
			rgba(226, 232, 240, 0.6),
			rgba(30, 41, 59, 0.6)
		);
		border: 1px solid light-dark(rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2));
		border-radius: 1.5rem;
		padding: 1.5rem;
	}

	.ai-output-section h3 {
		color: light-dark(#1e293b, #f8fafc);
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0 0 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.ai-output-content {
		background: light-dark(
			rgba(248, 250, 252, 0.8),
			rgba(15, 23, 42, 0.8)
		);
		border: 1px solid light-dark(rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.2));
		border-radius: 1rem;
		padding: 1.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.ai-output-content pre {
		margin: 0;
		white-space: pre-wrap;
		word-wrap: break-word;
		color: light-dark(#374151, #e2e8f0);
		line-height: 1.6;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.9rem;
	}

	.ai-placeholder {
		text-align: center;
		padding: 2rem;
		color: light-dark(#64748b, #94a3b8);
	}

	.ai-placeholder p {
		margin: 0;
		font-style: italic;
		line-height: 1.5;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-content {
			flex-direction: column;
			gap: 2rem;
			align-items: stretch;
		}

		.hero-text h1 {
			font-size: 2rem;
		}

		.stats-bar {
			grid-template-columns: repeat(2, 1fr);
		}

		.incidents-grid {
			grid-template-columns: 1fr;
		}

		.incident-actions {
			flex-direction: column;
		}

		.modal-container,
		.ai-modal-container {
			margin: 1rem;
			width: calc(100vw - 2rem);
		}

		.modal-header,
		.modal-form,
		.ai-modal-content {
			padding: 1.5rem;
		}

		.ai-outputs {
			grid-template-columns: 1fr;
		}

		.ai-actions {
			flex-direction: column;
		}

		.ai-interface {
			flex-direction: column;
			text-align: center;
		}
	}
</style>

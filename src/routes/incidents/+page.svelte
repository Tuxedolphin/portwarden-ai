<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	import { translateError } from '$lib/errorTranslator';

	/**
	 * @typedef {Object} Incident
	 * @property {string | number} id
	 * @property {string} title
	 * @property {string} description
	 * @property {'open' | 'in-progress' | 'resolved'} status
	 * @property {string} [created_at]
	 * @property {string[]} [tags]
	 */

	const pageSize = 6;

	let page = 1;
	let total = 0;
	/** @type {Incident[]} */
	let items = [];
	let loading = true;
	let toast = '';
	/** @type {ReturnType<typeof translateError> | null} */
	let errorObj = null;

	let showCreate = false;
	let title = '';
	let description = '';
	let tags = '';

	let showAiPanel = false;
	/** @type {Incident | null} */
	let selectedIncident = null;
	let playbookLoading = false;
	let escalationLoading = false;
	let playbookOutput = '';
	let escalationOutput = '';
	/** @type {ReturnType<typeof translateError> | null} */
	let aiError = null;

	const statusLabels = {
		open: 'Open',
		'in-progress': 'In Progress',
		resolved: 'Resolved'
	};

	/** @type {('open' | 'in-progress' | 'resolved')[]} */
	const statusOptions = ['open', 'in-progress', 'resolved'];

	$: totalPages = Math.max(1, Math.ceil(total / pageSize));
	$: openCount = items.filter((i) => i.status === 'open').length;
	$: inProgressCount = items.filter((i) => i.status === 'in-progress').length;
	$: resolvedCount = items.filter((i) => i.status === 'resolved').length;

	$: stats = [
		{ label: 'Open incidents', value: openCount },
		{ label: 'In progress', value: inProgressCount },
		{ label: 'Resolved (7d)', value: resolvedCount }
	];

	onMount(loadIncidents);

	async function loadIncidents() {
		loading = true;
		toast = '';
		errorObj = null;

		try {
			const res = await fetch(`/api/incidents?page=${page}&pageSize=${pageSize}`);
			/** @type {{ results?: any[]; total?: number }} */
			const data = await res.json();

			if (!res.ok) {
				throw { status: res.status, payload: data };
			}

			const results = Array.isArray(data.results) ? data.results : [];
			items = results.map((item) => ({
				id: item.id,
				title: item.title,
				description: item.description,
				status: item.status ?? 'open',
				created_at: item.created_at,
				tags: Array.isArray(item.tags) ? item.tags : []
			}));
			total = data.total ?? items.length;
		} catch (error) {
			errorObj = translateError(error);
			toast = errorObj?.message ?? 'Failed to load incidents.';
		} finally {
			loading = false;
		}
	}

	function resetCreateForm() {
		title = '';
		description = '';
		tags = '';
	}

	function closeCreateModal() {
		showCreate = false;
		resetCreateForm();
	}

	/** @param {SubmitEvent} event */
	async function submitCreate(event) {
		event.preventDefault();
		toast = '';

		try {
			const res = await fetch('/api/incidents', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description,
					tags: parseTags(tags)
				})
			});

			const data = await res.json();

			if (!res.ok) {
				throw { status: res.status, payload: data };
			}

			closeCreateModal();
			await loadIncidents();
			toast = 'Incident created successfully.';
		} catch (error) {
			errorObj = translateError(error);
			toast = errorObj?.message ?? 'Failed to create incident.';
		}
	}

	/**
	 * @param {Incident['id']} incidentId
	 * @param {'open' | 'in-progress' | 'resolved'} newStatus
	 */
	async function setStatus(incidentId, newStatus) {
		toast = '';

		try {
			const res = await fetch(`/api/incidents/${incidentId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});

			const data = await res.json();

			if (!res.ok) {
				throw { status: res.status, payload: data };
			}

			items = items.map((incident) =>
				incident.id === incidentId ? { ...incident, status: newStatus } : incident
			);
		} catch (error) {
			errorObj = translateError(error);
			toast = errorObj?.message ?? 'Failed to update status.';
		}
	}

	/** @param {Incident['id']} incidentId */
	async function archiveIncident(incidentId) {
		toast = '';

		try {
			const res = await fetch(`/api/incidents/${incidentId}/archive`, { method: 'POST' });
			const data = await res.json();

			if (!res.ok) {
				throw { status: res.status, payload: data };
			}

			await loadIncidents();
			toast = 'Incident archived.';
		} catch (error) {
			errorObj = translateError(error);
			toast = errorObj?.message ?? 'Failed to archive incident.';
		}
	}

	/** @param {Incident} incident */
	function openAiPanel(incident) {
		selectedIncident = incident;
		showAiPanel = true;
		playbookOutput = '';
		escalationOutput = '';
		aiError = null;
	}

	function closeAiPanel() {
		showAiPanel = false;
		selectedIncident = null;
		playbookOutput = '';
		escalationOutput = '';
		aiError = null;
	}

	/** @param {'playbook' | 'escalation'} intent */
	async function requestAi(intent) {
		if (!selectedIncident) return;

		aiError = null;

		if (intent === 'playbook') {
			playbookLoading = true;
		} else {
			escalationLoading = true;
		}

		try {
			const res = await fetch('/api/chatgpt', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ incidentId: selectedIncident.id, intent })
			});

			const data = await res.json();

			if (!res.ok) {
				throw { status: res.status, payload: data };
			}

			if (intent === 'playbook') {
				playbookOutput = data.output ?? '';
			} else {
				escalationOutput = data.output ?? '';
			}
		} catch (error) {
			aiError = translateError(error);
		} finally {
			playbookLoading = false;
			escalationLoading = false;
		}
	}

	/** @param {string} value */
	function parseTags(value) {
		return value
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean);
	}

	/** @param {string | undefined} value */
	function formatDate(value) {
		if (!value) return 'Unknown';
		const date = new Date(value);
		return date.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function nextPage() {
		if (page < totalPages) {
			page += 1;
			loadIncidents();
		}
	}

	function prevPage() {
		if (page > 1) {
			page -= 1;
			loadIncidents();
		}
	}
</script>

<svelte:head>
	<title>Incident Response | Portwarden AI</title>
</svelte:head>

<Header />

<main class="incidents-view">
	<section class="hero surface-card">
		<div class="hero__content">
			<div class="hero__copy">
				<h1>Incident Response Mission Control</h1>
				<p>
					Track disruptions, coordinate remediation, and collaborate with ChatGPT 5 Mini to generate
					response playbooks in seconds.
				</p>
				<div class="hero__actions">
					<button class="button-primary" on:click={() => (showCreate = true)}>
						+ Log incident
					</button>
					<button class="button-secondary" on:click={loadIncidents} disabled={loading}>
						↻ Refresh
					</button>
				</div>
			</div>

			<aside class="hero__panel surface-muted">
				<header class="panel-header">
					<h3>Today&apos;s posture</h3>
					<span class="status-pill online">ChatGPT 5 Mini online</span>
				</header>
				<ul class="stat-list">
					{#each stats as stat}
						<li>
							<span class="label">{stat.label}</span>
							<strong>{stat.value}</strong>
						</li>
					{/each}
				</ul>
			</aside>
		</div>
	</section>

	{#if toast}
		<div class="toast" role="status">{toast}</div>
	{/if}

	{#if errorObj}
		<section class="surface-card">
			<ErrorViewer {errorObj} onRetry={loadIncidents} />
		</section>
	{/if}

	<section class="incidents-grid">
		{#if loading}
			{#each Array(3) as _, index}
				<article class="incident-card incident-card--loading" aria-busy="true"></article>
			{/each}
		{:else if items.length === 0}
			<article class="surface-muted empty-state">
				<h2>No incidents yet</h2>
				<p>Log your first incident to begin tracking operational health.</p>
				<button class="button-primary" on:click={() => (showCreate = true)}>Log incident</button>
			</article>
		{:else}
			{#each items as incident (incident.id)}
				<article class="incident-card surface-card">
					<header class="incident-card__header">
						<span class="badge {incident.status}"
							>{statusLabels[incident.status] ?? incident.status}</span
						>
						<select
							class="status-select"
							bind:value={incident.status}
							on:change={(event) =>
								setStatus(
									incident.id,
									/** @type {'open' | 'in-progress' | 'resolved'} */ (event.currentTarget.value)
								)}
						>
							{#each statusOptions as status}
								<option value={status}>{statusLabels[status]}</option>
							{/each}
						</select>
					</header>

					<h3>{incident.title}</h3>
					<p>{incident.description}</p>

					{#if incident.tags?.length}
						<ul class="tag-list">
							{#each incident.tags as tag}
								<li>{tag}</li>
							{/each}
						</ul>
					{/if}

					<footer class="incident-card__footer">
						<div class="meta">
							<span>#{incident.id}</span>
							<span>Created {formatDate(incident.created_at)}</span>
						</div>
						<div class="actions">
							<button class="button-secondary" on:click={() => archiveIncident(incident.id)}>
								Archive
							</button>
							<button class="button-primary" on:click={() => openAiPanel(incident)}>
								Ask ChatGPT 5 Mini
							</button>
						</div>
					</footer>
				</article>
			{/each}
		{/if}
	</section>

	{#if totalPages > 1}
		<nav class="pagination" aria-label="Incident pages">
			<button class="button-secondary" on:click={prevPage} disabled={page === 1}> Previous </button>
			<span>Page {page} of {totalPages}</span>
			<button class="button-secondary" on:click={nextPage} disabled={page === totalPages}>
				Next
			</button>
		</nav>
	{/if}
</main>

{#if showCreate}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<div class="modal surface-card">
			<header class="modal__header">
				<h2>Log new incident</h2>
				<button class="close-btn" on:click={closeCreateModal} aria-label="Close">×</button>
			</header>

			<form class="modal__form" on:submit={submitCreate}>
				<label>
					<span>Title</span>
					<input
						type="text"
						placeholder="Database latency spike in Singapore"
						bind:value={title}
						required
					/>
				</label>

				<label>
					<span>Description</span>
					<textarea
						rows="4"
						placeholder="Summarise what happened, blast radius, and known impact."
						bind:value={description}
						required
					></textarea>
				</label>

				<label>
					<span>Tags</span>
					<input type="text" placeholder="database, apac, p1" bind:value={tags} />
					<small>Separate tags with commas.</small>
				</label>

				<footer class="modal__footer">
					<button type="button" class="button-secondary" on:click={closeCreateModal}>
						Cancel
					</button>
					<button type="submit" class="button-primary">Create incident</button>
				</footer>
			</form>
		</div>
	</div>
{/if}

{#if showAiPanel && selectedIncident}
	<div class="modal-overlay" role="dialog" aria-modal="true">
		<div class="modal modal--wide surface-card">
			<header class="modal__header">
				<div>
					<h2>ChatGPT 5 Mini co-pilot</h2>
					<p>Incident #{selectedIncident.id}: {selectedIncident.title}</p>
				</div>
				<button class="close-btn" on:click={closeAiPanel} aria-label="Close">×</button>
			</header>

			<section class="ai-panel">
				<div class="ai-panel__actions">
					<button
						class="button-primary"
						on:click={() => requestAi('playbook')}
						disabled={playbookLoading}
					>
						{playbookLoading ? 'Generating playbook…' : 'Generate playbook'}
					</button>
					<button
						class="button-secondary"
						on:click={() => requestAi('escalation')}
						disabled={escalationLoading}
					>
						{escalationLoading ? 'Drafting summary…' : 'Draft escalation'}
					</button>
				</div>

				{#if aiError}
					<ErrorViewer errorObj={aiError} />
				{/if}

				<div class="ai-panel__results">
					<article class="surface-muted">
						<header>
							<h3>Remediation playbook</h3>
						</header>
						{#if playbookOutput}
							<pre>{playbookOutput}</pre>
						{:else}
							<p class="placeholder">Run the co-pilot to generate step-by-step recovery actions.</p>
						{/if}
					</article>

					<article class="surface-muted">
						<header>
							<h3>Escalation summary</h3>
						</header>
						{#if escalationOutput}
							<pre>{escalationOutput}</pre>
						{:else}
							<p class="placeholder">Ask for an escalation brief tailored to leadership updates.</p>
						{/if}
					</article>
				</div>
			</section>
		</div>
	</div>
{/if}

<style>
	.incidents-view {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		padding: clamp(2.5rem, 6vw, 4rem) 0 clamp(4rem, 10vw, 5rem);
		width: min(1200px, 100% - 3rem);
		margin: 0 auto;
	}

	.hero {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: clamp(2rem, 4vw, 2.75rem);
		border-radius: var(--pw-card-radius);
	}

	.hero__content {
		display: flex;
		gap: clamp(2rem, 4vw, 3rem);
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.hero__copy {
		flex: 1 1 360px;
		display: grid;
		gap: 1.25rem;
	}

	.hero__copy h1 {
		margin: 0;
		font-size: clamp(2.4rem, 4vw, 3rem);
		letter-spacing: -0.02em;
	}

	.hero__copy p {
		margin: 0;
		color: var(--pw-text-secondary);
		font-size: 1.05rem;
	}

	.hero__actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.hero__panel {
		flex: 0 1 320px;
		padding: clamp(1.5rem, 3vw, 2rem);
		border-radius: calc(var(--pw-card-radius) - 6px);
		display: grid;
		gap: 1.5rem;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.status-pill {
		border-radius: 999px;
		padding: 0.35rem 0.9rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.status-pill.online {
		background: rgba(34, 197, 94, 0.15);
		color: #86efac;
		border: 1px solid rgba(34, 197, 94, 0.4);
	}

	.stat-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1rem;
	}

	.stat-list li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0.75rem 1rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 0.85rem;
		background: rgba(15, 23, 42, 0.55);
	}

	.stat-list .label {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--pw-text-muted);
	}

	.stat-list strong {
		font-size: 1.4rem;
		font-weight: 700;
	}

	.toast {
		align-self: flex-start;
		background: rgba(56, 189, 248, 0.16);
		border: 1px solid rgba(56, 189, 248, 0.35);
		color: #e0f2fe;
		padding: 0.65rem 1rem;
		border-radius: 0.9rem;
		font-weight: 500;
	}

	.incidents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.75rem;
	}

	.incident-card {
		display: grid;
		gap: 1.25rem;
		padding: clamp(1.5rem, 3vw, 2rem);
		position: relative;
		border-radius: var(--pw-card-radius);
	}

	.incident-card--loading {
		border: 1px solid rgba(148, 163, 184, 0.1);
		background: linear-gradient(
			135deg,
			rgba(30, 41, 59, 0.4),
			rgba(15, 23, 42, 0.5) 40%,
			rgba(30, 41, 59, 0.4) 60%
		);
		background-size: 200% 200%;
		animation: shimmer 2s infinite;
		min-height: 220px;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.incident-card__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.incident-card h3 {
		margin: 0;
		font-size: 1.25rem;
		letter-spacing: -0.01em;
	}

	.incident-card p {
		margin: 0;
		color: var(--pw-text-secondary);
		line-height: 1.55;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		border: 1px solid rgba(148, 163, 184, 0.3);
	}

	.badge.open {
		background: rgba(248, 113, 113, 0.16);
		color: #fecaca;
		border-color: rgba(248, 113, 113, 0.4);
	}

	.badge.in-progress {
		background: rgba(251, 191, 36, 0.18);
		color: #fde68a;
		border-color: rgba(251, 191, 36, 0.4);
	}

	.badge.resolved {
		background: rgba(34, 197, 94, 0.18);
		color: #bbf7d0;
		border-color: rgba(34, 197, 94, 0.45);
	}

	.status-select {
		border-radius: 0.75rem;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: rgba(15, 23, 42, 0.65);
		color: var(--pw-text-primary);
		padding: 0.45rem 0.85rem;
		font-size: 0.85rem;
	}

	.tag-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tag-list li {
		border-radius: 0.75rem;
		padding: 0.3rem 0.7rem;
		background: rgba(96, 165, 250, 0.14);
		color: #dbeafe;
		border: 1px solid rgba(96, 165, 250, 0.35);
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.incident-card__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.meta {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--pw-text-muted);
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.pagination {
		display: flex;
		justify-content: center;
		gap: 1.25rem;
		align-items: center;
		color: var(--pw-text-secondary);
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		border-radius: var(--pw-card-radius);
	}

	.empty-state h2 {
		margin: 0 0 0.75rem;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(5, 11, 24, 0.7);
		display: grid;
		place-items: center;
		padding: 1.5rem;
		z-index: 100;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.modal {
		width: min(540px, 100%);
		border-radius: var(--pw-card-radius);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: clamp(1.75rem, 4vw, 2.5rem);
	}

	.modal--wide {
		width: min(900px, 100%);
	}

	.modal__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1.5rem;
	}

	.modal__header h2 {
		margin: 0;
	}

	.modal__header p {
		margin: 0;
		color: var(--pw-text-muted);
	}

	.close-btn {
		border: none;
		background: transparent;
		color: var(--pw-text-muted);
		font-size: 1.5rem;
		cursor: pointer;
	}

	.modal__form {
		display: grid;
		gap: 1.25rem;
	}

	.modal__form label {
		display: grid;
		gap: 0.5rem;
		font-weight: 600;
	}

	.modal__form input,
	.modal__form textarea {
		border-radius: 0.85rem;
		border: 1px solid rgba(148, 163, 184, 0.35);
		background: rgba(15, 23, 42, 0.65);
		color: var(--pw-text-primary);
		padding: 0.75rem 1rem;
		font-weight: 500;
	}

	.modal__form small {
		font-weight: 400;
		color: var(--pw-text-muted);
	}

	.modal__footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.ai-panel {
		display: grid;
		gap: 1.5rem;
	}

	.ai-panel__actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.ai-panel__results {
		display: grid;
		gap: 1.5rem;
	}

	.ai-panel__results article {
		display: grid;
		gap: 1rem;
		padding: clamp(1.25rem, 3vw, 1.75rem);
		border-radius: calc(var(--pw-card-radius) - 6px);
	}

	.ai-panel__results h3 {
		margin: 0;
		font-size: 1.05rem;
	}

	.placeholder {
		margin: 0;
		color: var(--pw-text-muted);
	}

	pre {
		margin: 0;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.85rem;
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}

	@media (max-width: 960px) {
		.hero__content {
			flex-direction: column;
		}

		.hero__panel,
		.hero__copy {
			width: 100%;
		}

		.modal--wide {
			max-height: 90vh;
			overflow: auto;
		}
	}

	@media (max-width: 640px) {
		.incidents-view {
			width: min(100%, 100% - 2rem);
		}

		.hero__actions,
		.actions,
		.ai-panel__actions {
			flex-direction: column;
			align-items: stretch;
		}

		.stat-list li {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.35rem;
		}
	}
</style>

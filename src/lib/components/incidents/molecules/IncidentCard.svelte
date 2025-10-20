<script>
	import { Button, Select, Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui';
	import IncidentTag from '../atoms/IncidentTag.svelte';

	const STATUS_LABELS = /** @type {Record<string, string>} */ ({
		open: 'Open',
		'in-progress': 'In Progress',
		resolved: 'Resolved'
	});

	const EMPTY_ARRAY = /** @type {unknown[]} */ ([]);

	let { incident, statusOptions, onStatusUpdate, onSelectForAI, onArchive } = $props();

	/** @typedef {{ importantSafetyNotes?: unknown; actionSteps?: unknown; languageCommands?: unknown; checklists?: unknown }} PlaybookShape */

	/**
	 * @param {unknown} value
	 * @returns {Record<string, unknown>}
	 */
	function toRecord(value) {
		return value && typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : {};
	}

	/**
	 * @param {unknown} value
	 * @returns {unknown}
	 */
	function parseJsonSafe(value) {
		if (typeof value !== 'string' || value.trim().length === 0) return null;
		try {
			return JSON.parse(value);
		} catch (error) {
			console.warn('Failed to parse AI playbook JSON:', error);
			return null;
		}
	}

	/**
	 * @param {unknown} value
	 * @returns {string}
	 */
	function formatDateTime(value) {
		if (!value) return '—';
		const date =
			value instanceof Date
				? value
				: typeof value === 'number' || typeof value === 'string'
					? new Date(value)
					: new Date(Number.NaN);
		if (Number.isNaN(date.getTime())) {
			return '—';
		}
		return date.toLocaleString(undefined, {
			hour12: false,
			month: 'short',
			day: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	/**
	 * @param {unknown} value
	 * @returns {unknown[]}
	 */
	function ensureArray(value) {
		return Array.isArray(value) ? value : EMPTY_ARRAY;
	}

	/**
	 * @param {unknown} value
	 * @returns {string}
	 */
	function ensureString(value) {
		return typeof value === 'string' ? value.trim() : '';
	}

	/**
	 * @param {unknown} playbook
	 */
	function collectSafetyNotes(playbook) {
		const source = /** @type {PlaybookShape} */ (toRecord(playbook));
		return ensureArray(source.importantSafetyNotes)
			.map((note) => ensureString(note))
			.filter(Boolean);
	}

	/**
	 * @param {unknown} playbook
	 */
	function collectActionSteps(playbook) {
		const source = /** @type {PlaybookShape} */ (toRecord(playbook));
		return ensureArray(source.actionSteps)
			.map((step) => {
				const detail = toRecord(step);
				return {
					stepTitle: ensureString(detail.stepTitle),
					executionContext: ensureString(detail.executionContext),
					procedure: ensureArray(detail.procedure)
						.map((item) => ensureString(item))
						.filter(Boolean)
				};
			})
			.filter((step) => step.stepTitle || step.executionContext || step.procedure.length);
	}

	/**
	 * @param {unknown} playbook
	 */
	function collectLanguageCommands(playbook) {
		const source = /** @type {PlaybookShape} */ (toRecord(playbook));
		return ensureArray(source.languageCommands)
			.map((entry) => {
				const command = toRecord(entry);
				return {
					language: ensureString(command.language),
					command: ensureString(command.command)
				};
			})
			.filter((entry) => entry.language || entry.command);
	}

	/**
	 * @param {unknown} playbook
	 */
	function collectChecklists(playbook) {
		const source = /** @type {PlaybookShape} */ (toRecord(playbook));
		return ensureArray(source.checklists)
			.map((item) => {
				const checklist = toRecord(item);
				return {
					title: ensureString(checklist.title),
					items: ensureArray(checklist.items)
						.map((entry) => ensureString(entry))
						.filter(Boolean)
				};
			})
			.filter((item) => item.title || item.items.length);
	}

	const playbookData = $derived(parseJsonSafe(incident?.ai_playbook));
	const safetyNotes = $derived(collectSafetyNotes(playbookData));
	const actionSteps = $derived(collectActionSteps(playbookData));
	const languageCommands = $derived(collectLanguageCommands(playbookData));
	const checklists = $derived(collectChecklists(playbookData));
	const escalationSummary = $derived(ensureString(incident?.ai_escalation));
	const hasAiContent = $derived(Boolean(playbookData || escalationSummary));
	const createdDisplay = $derived(formatDateTime(incident?.created_at));
	const updatedDisplay = $derived(formatDateTime(incident?.updated_at));
	const statusLabel = $derived(
		(STATUS_LABELS[ensureString(incident?.status)] ?? ensureString(incident?.status)) || 'Unknown'
	);
</script>

<Card class="incident-card">
	<CardHeader class="incident-header">
		<div class="header-main">
			<div class="incident-code">
				{incident.caseCode || `#${incident.id}`}
			</div>
			<div class="incident-timestamps">
				<span>Created {createdDisplay}</span>
				{#if updatedDisplay && updatedDisplay !== createdDisplay}
					<span>Updated {updatedDisplay}</span>
				{/if}
			</div>
		</div>
		<div class="header-controls">
			<span class={`status-pill status-${incident.status}`}>{statusLabel}</span>
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
		</div>
	</CardHeader>

	<CardContent class="incident-body">
		<h3 class="incident-title">{incident.title}</h3>
		<p class="incident-description">{incident.description}</p>

		<div class="meta-grid">
			<div>
				<span class="meta-label">Incident ID</span>
				<span class="meta-value">#{incident.id}</span>
			</div>
			<div>
				<span class="meta-label">Case Code</span>
				<span class="meta-value">{incident.caseCode || '—'}</span>
			</div>
		</div>

		{#if incident.tags && incident.tags.length > 0}
			<div class="tag-cloud" aria-label="Incident tags">
				{#each incident.tags as tag}
					<IncidentTag {tag} />
				{/each}
			</div>
		{/if}

		<section class="ai-section" aria-label="AI generated guidance">
			{#if hasAiContent}
				<header class="section-header">
					<h4>Portwarden AI Guidance</h4>
					<p>Structured recommendations generated automatically from your incident details.</p>
				</header>

				{#if safetyNotes.length}
					<div class="playbook-block">
						<h5>Important Safety Notes</h5>
						<ul>
							{#each safetyNotes as note}
								<li>{note}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if actionSteps.length}
					<div class="playbook-block">
						<h5>Action Steps</h5>
						{#each actionSteps as step, index}
							<div class="action-step">
								<div class="step-header">
									<span class="step-index">{index + 1}</span>
									<div>
										<span class="step-title">{step.stepTitle || 'Operational Step'}</span>
										{#if step.executionContext}
											<p class="step-context">{step.executionContext}</p>
										{/if}
									</div>
								</div>
								{#if step.procedure.length}
									<ol>
										{#each step.procedure as item}
											<li>{item}</li>
										{/each}
									</ol>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				{#if languageCommands.length}
					<div class="playbook-block">
						<h5>Language Commands</h5>
						<div class="language-grid">
							{#each languageCommands as entry}
								<div class="language-card">
									<span class="language-label">{entry.language || 'Command'}</span>
									<p>{entry.command}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if checklists.length}
					<div class="playbook-block">
						<h5>Checklists</h5>
						<div class="checklist-grid">
							{#each checklists as checklist}
								<div class="checklist-card">
									<h6>{checklist.title || 'Checklist'}</h6>
									<ul>
										{#each checklist.items as item}
											<li>{item}</li>
										{/each}
									</ul>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if escalationSummary}
					<div class="playbook-block">
						<h5>Escalation Summary</h5>
						<p class="escalation-summary">{escalationSummary}</p>
					</div>
				{/if}
			{:else}
				<div class="ai-placeholder">
					<span class="placeholder-title">AI insights are on the way</span>
					<p>
						Portwarden AI is generating operational guidance for this incident. Refresh in a few
						moments to see the structured playbook and escalation summary.
					</p>
				</div>
			{/if}
		</section>
	</CardContent>

	<CardFooter class="incident-footer">
		<div class="incident-meta">
			<span class="meta-label">Status</span>
			<span class="meta-value">{statusLabel}</span>
		</div>
		<div class="incident-actions">
			<Button variant="secondary" size="sm" onclick={() => onSelectForAI(incident)}>Ask AI</Button>
			<Button variant="outline" size="sm" onclick={() => onArchive(incident.id)}>Archive</Button>
		</div>
	</CardFooter>
</Card>

<style>
	.incident-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.incident-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
	}

	.header-main {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.incident-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 1rem;
		font-weight: 600;
		color: #94a3b8;
		letter-spacing: 0.04em;
	}

	.incident-timestamps {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.85rem;
		color: #94a3b8;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.status-open {
		background: rgba(59, 130, 246, 0.2);
		color: #93c5fd;
	}

	.status-in-progress {
		background: rgba(250, 204, 21, 0.2);
		color: #facc15;
	}

	.status-resolved {
		background: rgba(34, 197, 94, 0.2);
		color: #86efac;
	}

	.incident-body {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.incident-title {
		font-size: 1.4rem;
		font-weight: 700;
		color: #f8fafc;
		margin: 0;
	}

	.incident-description {
		color: #cbd5e1;
		margin: 0;
		line-height: 1.6;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 1rem;
	}

	.meta-label {
		display: block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(148, 163, 184, 0.8);
		margin-bottom: 0.25rem;
	}

	.meta-value {
		font-weight: 600;
		color: #e2e8f0;
	}

	.tag-cloud {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.ai-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.25rem;
		border-radius: 1rem;
		background: linear-gradient(135deg, rgba(15, 23, 42, 0.4), rgba(30, 41, 59, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.2);
	}

	.section-header h4 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: #bfdbfe;
	}

	.section-header p {
		margin: 0.25rem 0 0;
		color: #94a3b8;
		font-size: 0.95rem;
	}

	.playbook-block {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.85rem;
		background: rgba(15, 23, 42, 0.55);
		border: 1px solid rgba(30, 64, 175, 0.3);
	}

	.playbook-block h5 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: #e0f2fe;
	}

	.playbook-block ul,
	.playbook-block ol {
		margin: 0;
		padding-left: 1.25rem;
		color: #cbd5f5;
		line-height: 1.6;
	}

	.action-step {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-top: 1px solid rgba(148, 163, 184, 0.2);
	}

	.action-step:first-of-type {
		border-top: none;
	}

	.step-header {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.step-index {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: rgba(96, 165, 250, 0.2);
		color: #bfdbfe;
		font-weight: 700;
	}

	.step-title {
		display: block;
		font-weight: 600;
		color: #e2e8f0;
	}

	.step-context {
		margin: 0.15rem 0 0;
		color: #94a3b8;
		font-size: 0.9rem;
	}

	.language-grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.language-card {
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: rgba(30, 64, 175, 0.25);
		border: 1px solid rgba(37, 99, 235, 0.35);
	}

	.language-label {
		display: block;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #bfdbfe;
		margin-bottom: 0.35rem;
	}

	.language-card p {
		margin: 0;
		color: #e2e8f0;
	}

	.checklist-grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	}

	.checklist-card {
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: rgba(30, 41, 59, 0.5);
		border: 1px solid rgba(148, 163, 184, 0.2);
	}

	.checklist-card h6 {
		margin: 0 0 0.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: #e2e8f0;
	}

	.checklist-card ul {
		padding-left: 1.1rem;
		color: #cbd5e1;
	}

	.checklist-card li {
		margin-bottom: 0.35rem;
	}

	.escalation-summary {
		margin: 0;
		color: #e2e8f0;
		line-height: 1.6;
	}

	.ai-placeholder {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1rem;
		border-radius: 0.85rem;
		background: rgba(30, 41, 59, 0.45);
		border: 1px dashed rgba(148, 163, 184, 0.35);
		color: #94a3b8;
		font-size: 0.95rem;
	}

	.placeholder-title {
		font-weight: 600;
		color: #bfdbfe;
	}

	.incident-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		border-top: 1px solid rgba(148, 163, 184, 0.2);
		padding-top: 1rem;
	}

	.incident-meta {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.incident-actions {
		display: flex;
		gap: 0.75rem;
	}

	@media (max-width: 768px) {
		.incident-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-controls {
			width: 100%;
			justify-content: space-between;
		}

		.incident-actions {
			width: 100%;
			flex-direction: column;
		}

		.language-grid,
		.checklist-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

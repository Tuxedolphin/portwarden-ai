<script>
	import { Button, Select, Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui';
	import IncidentTag from '../atoms/IncidentTag.svelte';

	const EMPTY_ARRAY = /** @type {unknown[]} */ ([]);

	let {
		incident,
		statusOptions = [],
		onStatusUpdate = () => {},
		onArchive = () => {},
		onDelete = () => {}
	} = $props();

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
	 * @returns {string[]}
	 */
	function collectSafetyNotes(playbook) {
		const source = /** @type {PlaybookShape} */ (toRecord(playbook));
		return ensureArray(source.importantSafetyNotes)
			.map((note) => ensureString(note))
			.filter(Boolean);
	}

	/**
	 * @param {unknown} playbook
	 * @returns {Array<{ stepTitle: string; executionContext: string; procedure: string[] }>}
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
	 * @returns {Array<{ language: string; command: string }>}
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
	 * @returns {Array<{ title: string; items: string[] }>}
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

	/**
	 * @param {unknown} playbook
	 * @returns {string}
	 */
	function serialisePlaybook(playbook) {
		if (!playbook) return '';
		if (typeof playbook === 'string') {
			return playbook.trim();
		}
		try {
			return JSON.stringify(playbook, null, 2);
		} catch (error) {
			console.warn('Failed to serialise playbook:', error);
			return '';
		}
	}

	const aiPlaybookRaw = $derived(() => serialisePlaybook(incident?.ai_playbook));
	const playbookData = $derived(() => parseJsonSafe(aiPlaybookRaw()));
	const safetyNotes = $derived(() => collectSafetyNotes(playbookData()));
	const actionSteps = $derived(() => collectActionSteps(playbookData()));
	const languageCommands = $derived(() => collectLanguageCommands(playbookData()));
	const checklists = $derived(() => collectChecklists(playbookData()));
	const escalationSummary = $derived(() => ensureString(incident?.ai_escalation));
	const playbookHasContent = $derived(() => {
		const notes = safetyNotes();
		const steps = actionSteps();
		const commands = languageCommands();
		const lists = checklists();
		return notes.length > 0 || steps.length > 0 || commands.length > 0 || lists.length > 0;
	});
	const escalationHasContent = $derived(() => escalationSummary().length > 0);
	const rawPlaybookJson = $derived(() => {
		if (playbookHasContent()) return '';
		const raw = aiPlaybookRaw();
		return raw.length > 0 ? raw : '';
	});
	const hasRawFallback = $derived(() => rawPlaybookJson().length > 0);
	const showStructuredAi = $derived(() => playbookHasContent() || escalationHasContent());
	const createdDisplay = $derived(() => formatDateTime(incident?.created_at));
	const updatedDisplay = $derived(() => formatDateTime(incident?.updated_at));
	const statusValue = $derived(() => ensureString(incident?.status) || 'open');

	let expanded = $state(false);
	/** @type {Set<string>} */
	let checklistCompletion = $state(new Set());
	const detailButtonLabel = $derived(() => (expanded ? 'Hide details' : 'Show details'));
	/** @type {number | string | null} */
	let lastIncidentId = null;

	function toggleExpanded() {
		expanded = !expanded;
	}

	/**
	 * @param {string} key
	 * @param {boolean} checked
	 */
	function setChecklistItem(key, checked) {
		const next = new Set(checklistCompletion);
		if (checked) {
			next.add(key);
		} else {
			next.delete(key);
		}
		checklistCompletion = next;
	}

	$effect(() => {
		const currentId = incident?.id ?? null;
		if (currentId === lastIncidentId) {
			return;
		}
		lastIncidentId = currentId;
		checklistCompletion = new Set();
		expanded = false;
	});
</script>

<Card class="incident-card">
	<CardHeader class="incident-header">
		<div class="header-main">
			<div class="incident-code">
				{incident.caseCode || `#${incident.id}`}
			</div>
			<div class="incident-timestamps">
				<span>Created {createdDisplay()}</span>
				{#if updatedDisplay() && updatedDisplay() !== createdDisplay()}
					<span>Updated {updatedDisplay()}</span>
				{/if}
			</div>
		</div>
		<div class="header-controls">
			<div class="status-dropdown">
				<Select
					variant="status"
					size="sm"
					value={statusValue()}
					statusValue={statusValue()}
					options={statusOptions}
					onchange={(/** @type {CustomEvent} */ e) => onStatusUpdate(incident.id, e.detail)}
					class="status-select"
					aria-label="Update incident status"
				/>
			</div>
		</div>
	</CardHeader>

	<CardContent class="incident-body">
		<h3 class="incident-title">{incident.title}</h3>
		<p class="incident-description">{incident.description}</p>

		<div class="summary-actions">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="toggle-details"
				aria-expanded={expanded}
				onclick={toggleExpanded}
			>
				{detailButtonLabel()}
			</Button>
		</div>

		{#if expanded}
			<div class="incident-details">
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
					{#if showStructuredAi()}
						<header class="section-header">
							<h4>Portwarden AI Guidance</h4>
							<p>Structured recommendations generated automatically from your incident details.</p>
						</header>

						{#if safetyNotes().length}
							<div class="playbook-block">
								<h5>Important Safety Notes</h5>
								<ul>
									{#each safetyNotes() as note}
										<li>{note}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if actionSteps().length}
							<div class="playbook-block">
								<h5>Action Steps</h5>
								{#each actionSteps() as step, index}
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

						{#if languageCommands().length}
							<div class="playbook-block">
								<h5>Language Commands</h5>
								<div class="language-grid">
									{#each languageCommands() as entry}
										<div class="language-card">
											<span class="language-label">{entry.language || 'Command'}</span>
											<p>{entry.command}</p>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if checklists().length}
							<div class="playbook-block">
								<h5>Checklists</h5>
								<div class="checklist-grid">
									{#each checklists() as checklist, listIndex}
										<div class="checklist-card">
											<h6>{checklist.title || 'Checklist'}</h6>
											<ul>
												{#each checklist.items as item, itemIndex}
													{@const itemKey = `${incident.id ?? 'temp'}-${listIndex}-${itemIndex}`}
													<li class="checklist-item">
														<label>
															<input
																type="checkbox"
																class="checklist-checkbox"
																checked={checklistCompletion.has(itemKey)}
																onchange={(event) =>
																	setChecklistItem(itemKey, event.currentTarget.checked)}
															/>
															<span>{item}</span>
														</label>
													</li>
												{/each}
											</ul>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if escalationHasContent()}
							<div class="playbook-block">
								<h5>Escalation Summary</h5>
								<p class="escalation-summary">{escalationSummary()}</p>
							</div>
						{/if}

						{#if hasRawFallback() && !playbookHasContent()}
							<div class="playbook-block raw-json">
								<h5>AI Playbook (Raw)</h5>
								<p class="raw-hint">
									Portwarden AI returned data outside the standard schema. Review the JSON below.
								</p>
								<pre>{rawPlaybookJson()}</pre>
							</div>
						{/if}
					{:else if hasRawFallback()}
						<div class="playbook-block raw-json">
							<h5>AI Playbook (Raw)</h5>
							<p class="raw-hint">
								Portwarden AI responded, but structured guidance is still empty. Inspect the raw
								output below.
							</p>
							<pre>{rawPlaybookJson()}</pre>
						</div>
					{:else}
						<div class="ai-loading" role="status" aria-live="polite">
							<span class="loading-label">Generating AI guidance</span>
							<div class="loading-bar">
								<div class="loading-bar__progress"></div>
							</div>
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</CardContent>

	<CardFooter class="incident-footer">
		<div class="incident-actions">
			<Button variant="outline" size="sm" onclick={() => onArchive(incident.id)}>Archive</Button>
			<Button variant="destructive" size="sm" onclick={() => onDelete(incident.id)}>Delete</Button>
		</div>
	</CardFooter>
</Card>

<style>
	:global(.incident-card) {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	:global(.incident-header) {
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

	:global(.incident-body) {
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

	.summary-actions {
		display: flex;
		justify-content: flex-start;
	}

	:global(.toggle-details) {
		margin-top: 0.25rem;
		padding-inline: 0.75rem;
	}

	.incident-details {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1rem;
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

	.checklist-card ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: #cbd5f5;
		line-height: 1.6;
	}

	.checklist-item label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.checklist-checkbox {
		width: 1rem;
		height: 1rem;
		margin-top: 0.2rem;
		accent-color: #3b82f6;
	}

	.checklist-item span {
		flex: 1;
	}

	.escalation-summary {
		margin: 0;
		color: #e2e8f0;
		line-height: 1.6;
	}

	.ai-loading {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.85rem;
		background: rgba(15, 23, 42, 0.55);
		border: 1px solid rgba(30, 64, 175, 0.3);
	}

	.loading-label {
		color: #94a3b8;
		font-size: 0.95rem;
	}

	.loading-bar {
		position: relative;
		overflow: hidden;
		height: 0.5rem;
		border-radius: 999px;
		background: rgba(148, 163, 184, 0.25);
	}

	.loading-bar__progress {
		position: absolute;
		inset: 0;
		transform: translateX(-100%);
		background: linear-gradient(
			90deg,
			rgba(59, 130, 246, 0.2),
			rgba(59, 130, 246, 0.8),
			rgba(59, 130, 246, 0.2)
		);
		animation: loading-slide 2s infinite;
	}

	@keyframes loading-slide {
		0% {
			transform: translateX(-100%);
		}
		50% {
			transform: translateX(0%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.raw-json pre {
		margin: 0;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: rgba(10, 16, 32, 0.75);
		border: 1px solid rgba(59, 130, 246, 0.2);
		color: #e2e8f0;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85rem;
		overflow-x: auto;
	}

	.raw-hint {
		margin: 0;
		color: #94a3b8;
		font-size: 0.9rem;
	}

	:global(.incident-footer) {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		border-top: 1px solid rgba(148, 163, 184, 0.2);
		padding-top: 1rem;
	}

	.incident-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	@media (max-width: 768px) {
		:global(.incident-header) {
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

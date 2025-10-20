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

	/** @typedef {{ importantSafetyNotes?: unknown; actionSteps?: unknown; verificationSteps?: unknown; checklists?: unknown }} PlaybookShape */

	/**
	 * @param {unknown} value
	 * @returns {Record<string, unknown>}
	 */
	function toRecord(value) {
		return value && typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : {};
	}

	/**
	 * @param {unknown} value
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
	 * @returns {Array<{ stepTitle: string; executionContext: string; procedure: string[]; checklistItems: string[] }>}
	 */
	function collectActionSteps(playbook) {
		const source = /** @type {PlaybookShape} */ (toRecord(playbook));
		return ensureArray(source.actionSteps)
			.map((step) => {
				const detail = toRecord(step);
				const procedure = ensureArray(detail.procedure)
					.map((item) => ensureString(item))
					.filter(Boolean);
				const checklistItems = ensureArray(detail.checklistItems)
					.map((item) => ensureString(item))
					.filter(Boolean);
				return {
					stepTitle: ensureString(detail.stepTitle),
					executionContext: ensureString(detail.executionContext),
					procedure,
					checklistItems
				};
			})
			.filter(
				(step) =>
					step.stepTitle ||
					step.executionContext ||
					step.procedure.length ||
					step.checklistItems.length
			);
	}

	/**
	 * @param {unknown} playbook
	 * @returns {string[]}
	 */
	function collectVerificationSteps(playbook) {
		const source = /** @type {PlaybookShape} */ (toRecord(playbook));
		return ensureArray(source.verificationSteps)
			.map((step) => ensureString(step))
			.filter(Boolean);
	}

	/**
	 * @param {unknown} playbook
	 * @returns {Array<{ title: string; items: string[]; relatedStep: string }>}
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
						.filter(Boolean),
					relatedStep: ensureString(checklist.relatedStep)
				};
			})
			.filter((item) => item.title || item.items.length);
	}

	/**
	 * @param {String} value
	 */
	function normaliseLookup(value) {
		return ensureString(value).toLowerCase();
	}

	/**
	 * @param {unknown} value
	 * @returns {string}
	 */
	function formatLikelihood(value) {
		const normalised = ensureString(value).toLowerCase();
		if (!normalised) return '';
		return normalised.charAt(0).toUpperCase() + normalised.slice(1);
	}

	/**
	 * @param {string} type
	 * @param {...(string|number)} parts
	 * @returns {string}
	 */
	function makeCompletionKey(type, ...parts) {
		return [type, ...parts].map((part) => String(part ?? '')).join('::');
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
	const verificationSteps = $derived(() => collectVerificationSteps(playbookData()));
	const checklists = $derived(() => collectChecklists(playbookData()));
	const escalationSummary = $derived(() => ensureString(incident?.ai_escalation));
	const escalationLikelihood = $derived(() => ensureString(incident?.ai_escalation_likelihood));
	const escalationReasoning = $derived(() => ensureString(incident?.ai_escalation_reasoning));
	const checklistsByStep = $derived(() => {
		const map = new Map();
		for (const entry of checklists()) {
			const key = normaliseLookup(entry.relatedStep);
			if (!key) continue;
			if (!map.has(key)) {
				map.set(key, []);
			}
			map.get(key).push(entry);
		}
		return map;
	});
	const generalChecklists = $derived(() =>
		checklists().filter((item) => !normaliseLookup(item.relatedStep))
	);
	const playbookHasContent = $derived(() => {
		const notes = safetyNotes();
		const steps = actionSteps();
		const verification = verificationSteps();
		const lists = checklists();
		return notes.length > 0 || steps.length > 0 || verification.length > 0 || lists.length > 0;
	});
	const escalationHasContent = $derived(() => escalationSummary().length > 0);
	const rawPlaybookJson = $derived(() => {
		if (playbookHasContent()) return '';
		const raw = aiPlaybookRaw();
		return raw.length > 0 ? raw : '';
	});
	const hasRawFallback = $derived(() => rawPlaybookJson().length > 0);
	const aiPending = $derived(() => !playbookHasContent() && !hasRawFallback());
	const formattedEscalationLikelihood = $derived(() => formatLikelihood(escalationLikelihood()));
	const descriptionText = $derived(
		() => ensureString(incident?.ai_description) || ensureString(incident?.description)
	);
	const createdDisplay = $derived(() => formatDateTime(incident?.created_at));
	const updatedDisplay = $derived(() => formatDateTime(incident?.updated_at));
	const statusValue = $derived(() => ensureString(incident?.status) || 'open');
	let expanded = $state(false);
	let showEscalation = $state(false);
	/** @type {Set<string>} */
	let completedItems = $state(new Set());
	const detailButtonLabel = $derived(() => (expanded ? 'Hide details' : 'Show details'));
	const escalateButtonLabel = $derived(() => (showEscalation ? 'Hide escalation' : 'Escalate'));
	/** @type {number | string | null} */
	let lastIncidentId = null;

	function toggleExpanded() {
		expanded = !expanded;
	}

	function toggleEscalation() {
		showEscalation = !showEscalation;
	}

	/**
	 * @param {string} key
	 * @param {boolean} checked
	 */
	function setCompletion(key, checked) {
		const next = new Set(completedItems);
		if (checked) {
			next.add(key);
		} else {
			next.delete(key);
		}
		completedItems = next;
	}

	$effect(() => {
		const currentId = incident?.id ?? null;
		if (currentId === lastIncidentId) {
			return;
		}
		lastIncidentId = currentId;
		completedItems = new Set();
		expanded = false;
		showEscalation = false;
	});

	/**
	 * Get the checklists associated with a specific action step.
	 * @param {String} stepTitle
	 */
	function getChecklistsForStep(stepTitle) {
		const key = normaliseLookup(stepTitle);
		if (!key) return EMPTY_ARRAY;
		return checklistsByStep().get(key) ?? EMPTY_ARRAY;
	}
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
		<p class="incident-description">{descriptionText() || '—'}</p>

		<div class="incident-summary">
			<div class="summary-pill">
				<span class="summary-label">Case Code</span>
				<span class="summary-value">{incident.caseCode || '—'}</span>
			</div>
			<div class="summary-pill">
				<span class="summary-label">Incident ID</span>
				<span class="summary-value">#{incident.id}</span>
			</div>
			<div class="summary-pill">
				<span class="summary-label">Last update</span>
				<span class="summary-value">{updatedDisplay() || createdDisplay()}</span>
			</div>
		</div>

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
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="toggle-escalation"
				aria-expanded={showEscalation}
				onclick={toggleEscalation}
			>
				{escalateButtonLabel()}
			</Button>
		</div>

		{#if aiPending()}
			<div class="ai-loading" role="status" aria-live="polite">
				<div class="loading-track" aria-hidden="true">
					<div class="loading-indicator"></div>
				</div>
				<span class="loading-text">AI co-pilot is generating guidance…</span>
			</div>
		{/if}

		{#if expanded || showEscalation}
			<div class="incident-details">
				{#if incident.tags && incident.tags.length > 0}
					<div class="tag-cloud" aria-label="Incident tags">
						{#each incident.tags as tag}
							<IncidentTag {tag} />
						{/each}
					</div>
				{/if}

				{#if expanded}
					<section class="ai-section" aria-label="AI playbook guidance">
						<header class="section-header">
							<h4>Remediation Playbook</h4>
							<p>Operational actions generated automatically for this incident.</p>
						</header>

						{#if playbookHasContent()}
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
										{@const stepBaseKey = makeCompletionKey('step', incident.id ?? 'temp', index)}
										{@const attachedChecklists = getChecklistsForStep(step.stepTitle)}
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
											{#if step.checklistItems.length}
												<ul class="completion-list inline-checklist">
													{#each step.checklistItems as item, itemIndex}
														{@const itemKey = makeCompletionKey('inline', stepBaseKey, itemIndex)}
														<li
															class="completion-item"
															class:completed={completedItems.has(itemKey)}
														>
															<label>
																<input
																	type="checkbox"
																	checked={completedItems.has(itemKey)}
																	onchange={(event) =>
																		setCompletion(itemKey, event.currentTarget.checked)}
																/>
																<span class="item-text">{item}</span>
															</label>
														</li>
													{/each}
												</ul>
											{/if}
											{#if attachedChecklists.length}
												<div class="attached-checklists">
													{#each attachedChecklists as checklist, listIndex}
														<div class="checklist-card inline">
															<h6>{checklist.title || 'Checklist'}</h6>
															<ul class="completion-list">
																{#each checklist.items as item, itemIndex}
																	{@const itemKey = makeCompletionKey(
																		'related',
																		stepBaseKey,
																		listIndex,
																		itemIndex
																	)}
																	<li
																		class="completion-item"
																		class:completed={completedItems.has(itemKey)}
																	>
																		<label>
																			<input
																				type="checkbox"
																				checked={completedItems.has(itemKey)}
																				onchange={(event) =>
																					setCompletion(itemKey, event.currentTarget.checked)}
																			/>
																			<span class="item-text">{item}</span>
																		</label>
																	</li>
																{/each}
															</ul>
														</div>
													{/each}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}

							{#if verificationSteps().length}
								<div class="playbook-block">
									<h5>Verification</h5>
									<ul class="completion-list verification-list">
										{#each verificationSteps() as step, index}
											{@const itemKey = makeCompletionKey('verify', incident.id ?? 'temp', index)}
											<li class="completion-item" class:completed={completedItems.has(itemKey)}>
												<label>
													<input
														type="checkbox"
														checked={completedItems.has(itemKey)}
														onchange={(event) =>
															setCompletion(itemKey, event.currentTarget.checked)}
													/>
													<span class="item-text">{step}</span>
												</label>
											</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if generalChecklists().length}
								<div class="playbook-block">
									<h5>Checklists</h5>
									<div class="checklist-grid">
										{#each generalChecklists() as checklist, listIndex}
											<div class="checklist-card">
												<h6>{checklist.title || 'Checklist'}</h6>
												<ul>
													{#each checklist.items as item, itemIndex}
														{@const itemKey = makeCompletionKey(
															'general',
															incident.id ?? 'temp',
															listIndex,
															itemIndex
														)}
														<li
															class="checklist-item completion-item"
															class:completed={completedItems.has(itemKey)}
														>
															<label>
																<input
																	type="checkbox"
																	checked={completedItems.has(itemKey)}
																	onchange={(event) =>
																		setCompletion(itemKey, event.currentTarget.checked)}
																/>
																<span class="item-text">{item}</span>
															</label>
														</li>
													{/each}
												</ul>
											</div>
										{/each}
									</div>
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
							<div class="ai-placeholder">
								<p>No AI playbook is available yet. Use the AI Co-pilot to generate one.</p>
							</div>
						{/if}
					</section>
				{/if}

				{#if showEscalation}
					<section class="ai-section escalation-section" aria-label="Escalation guidance">
						<header class="section-header">
							<h4>Escalation Details</h4>
							<p>AI-generated escalation assessment for duty officer review.</p>
						</header>

						{#if escalationHasContent()}
							<div class="playbook-block">
								<h5>Summary</h5>
								{#if formattedEscalationLikelihood()}
									<p
										class="escalation-likelihood"
										data-likelihood={escalationLikelihood() || 'unknown'}
									>
										Likelihood: <strong>{formattedEscalationLikelihood()}</strong>
									</p>
								{/if}
								<p class="escalation-summary">{escalationSummary()}</p>
								{#if escalationReasoning().length}
									<div class="escalation-reasoning">
										<h6>Reasoning</h6>
										<p>{escalationReasoning()}</p>
									</div>
								{/if}
							</div>
						{:else}
							<div class="ai-placeholder">
								<p>
									No escalation guidance is available yet. Generate an escalation from the AI
									Co-pilot.
								</p>
							</div>
						{/if}
					</section>
				{/if}
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

	.incident-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.summary-pill {
		background: rgba(15, 23, 42, 0.65);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.summary-label {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(148, 163, 184, 0.85);
	}

	.summary-value {
		font-weight: 600;
		color: #e2e8f0;
	}

	.summary-actions {
		display: flex;
		justify-content: flex-start;
		margin-top: 0.25rem;
	}

	.ai-loading {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.9rem 1rem;
		border-radius: 0.75rem;
		background: rgba(15, 23, 42, 0.45);
		border: 1px solid rgba(59, 130, 246, 0.25);
	}

	.loading-track {
		position: relative;
		overflow: hidden;
		height: 6px;
		border-radius: 999px;
		background: rgba(15, 118, 210, 0.2);
	}

	.loading-indicator {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 40%;
		border-radius: 999px;
		background: linear-gradient(90deg, rgba(96, 165, 250, 0.35), rgba(96, 165, 250, 0.8));
		animation: loading-slide 1.4s ease-in-out infinite;
	}

	.loading-text {
		font-size: 0.9rem;
		color: #bfdbfe;
	}

	:global(.toggle-details) {
		margin-top: 0.25rem;
		padding-inline: 0.75rem;
	}

	.incident-details {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 1.5rem;
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
		gap: 0.9rem;
		padding: 1.15rem;
		border-radius: 0.85rem;
		background: rgba(15, 23, 42, 0.55);
		border: 1px solid rgba(30, 64, 175, 0.3);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
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
		padding-left: 1.5rem;
		color: #cbd5f5;
		line-height: 1.6;
	}

	.playbook-block li + li {
		margin-top: 0.35rem;
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

	.verification-list {
		margin: 0;
		padding: 0;
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

	.completion-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: #cbd5f5;
		line-height: 1.6;
	}

	.inline-checklist {
		margin-top: 0.5rem;
	}

	.attached-checklists {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.checklist-card.inline {
		background: rgba(15, 23, 42, 0.35);
		border: 1px dashed rgba(148, 163, 184, 0.25);
	}

	.completion-item label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(15, 23, 42, 0.35);
		border: 1px solid rgba(148, 163, 184, 0.15);
		border-radius: 0.65rem;
		padding: 0.55rem 0.75rem;
	}

	.completion-item input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		margin-top: 0;
		accent-color: #3b82f6;
	}

	.completion-item .item-text {
		flex: 1;
		font-weight: 500;
		color: #e2e8f0;
		position: relative;
		transition: color 0.2s ease;
	}

	.completion-item .item-text::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 2px;
		background: rgba(148, 163, 184, 0.45);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 0.25s ease;
	}

	.completion-item.completed label {
		background: rgba(22, 33, 52, 0.55);
		border-color: rgba(59, 130, 246, 0.35);
	}

	.completion-item.completed .item-text {
		color: #94a3b8;
	}

	.completion-item.completed .item-text::after {
		transform: scaleX(1);
	}

	.escalation-summary {
		margin: 0;
		color: #e2e8f0;
		line-height: 1.6;
	}

	.escalation-likelihood {
		margin: 0;
		font-size: 0.9rem;
		color: #bfdbfe;
		letter-spacing: 0.03em;
		text-transform: uppercase;
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

		.checklist-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

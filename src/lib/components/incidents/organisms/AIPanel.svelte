<script>
	import { Button, Avatar } from '$lib/components/ui';
	import ErrorViewer from '$lib/ErrorViewer.svelte';

	let {
		selectedIncident,
		showAiPanel = $bindable(),
		playbookOutput = $bindable(''),
		playbookPayload = $bindable(null),
		escalationOutput = $bindable(''),
		escalationPayload = $bindable(null),
		playbookLoading = $bindable(false),
		escalationLoading = $bindable(false),
		errorObj = $bindable(null),
		onRequestGpt5
	} = $props();

	let showRawPlaybook = $state(false);
	let showRawEscalation = $state(false);
	/** @type {Set<string>} */
	let completionSet = $state(new Set());

	$effect(() => {
		playbookPayload;
		showRawPlaybook = false;
		completionSet = new Set();
	});

	$effect(() => {
		escalationPayload;
		showRawEscalation = false;
	});

	$effect(() => {
		selectedIncident?.id;
		completionSet = new Set();
	});

	/**
	 * @template T
	 * @param {T[] | null | undefined} value
	 * @returns {T[]}
	 */
	function ensureArray(value) {
		return Array.isArray(value) ? value : [];
	}

	/**
	 * @param {unknown} value
	 * @returns {string}
	 */
	function ensureString(value) {
		return typeof value === 'string' ? value.trim() : '';
	}

	/**
	 * @param {string | null | undefined} value
	 * @returns {string}
	 */
	function normaliseLookup(value) {
		return ensureString(value).toLowerCase();
	}

	/**
	 * @param {import('$lib/types/playbook').PlaybookPayload | null} payload
	 * @returns {string[]}
	 */
	function getVerificationSteps(payload) {
		if (!payload) return [];
		return ensureArray(payload.verificationSteps).map(ensureString).filter(Boolean);
	}

	/**
	 * @param {import('$lib/types/playbook').PlaybookActionStep | null | undefined} step
	 * @returns {string[]}
	 */
	function getInlineChecklist(step) {
		if (!step || typeof step !== 'object') return [];
		return ensureArray(step.checklistItems).map(ensureString).filter(Boolean);
	}

	/**
	 * @param {Partial<import('$lib/types/playbook').PlaybookChecklist> | null | undefined} entry
	 * @returns {import('$lib/types/playbook').PlaybookChecklist}
	 */
	function toChecklistView(entry) {
		const title = ensureString(entry?.title);
		const items = ensureArray(entry?.items).map(ensureString).filter(Boolean);
		return {
			title,
			items,
			relatedStep: ensureString(entry?.relatedStep)
		};
	}

	/**
	 * @param {import('$lib/types/playbook').PlaybookPayload | null | undefined} payload
	 * @param {string | null | undefined} stepTitle
	 * @returns {import('$lib/types/playbook').PlaybookChecklist[]}
	 */
	function getRelatedChecklists(payload, stepTitle) {
		if (!payload || !Array.isArray(payload.checklists)) return [];
		const lookup = normaliseLookup(stepTitle);
		if (!lookup) return [];
		return payload.checklists
			.filter((checklist) => normaliseLookup(checklist.relatedStep) === lookup)
			.map(toChecklistView)
			.filter((checklist) => checklist.title || checklist.items.length);
	}

	/**
	 * @param {import('$lib/types/playbook').PlaybookPayload | null | undefined} payload
	 * @returns {import('$lib/types/playbook').PlaybookChecklist[]}
	 */
	function getGeneralChecklists(payload) {
		if (!payload || !Array.isArray(payload.checklists)) return [];
		return payload.checklists
			.filter((checklist) => !normaliseLookup(checklist.relatedStep))
			.map(toChecklistView)
			.filter((checklist) => checklist.title || checklist.items.length);
	}

	/**
	 * @param {string} type
	 * @param {...(string | number)} parts
	 * @returns {string}
	 */
	function makeCompletionKey(type, ...parts) {
		return [type, ...parts].map((part) => String(part ?? '')).join('::');
	}

	/**
	 * @param {string} key
	 * @param {boolean} checked
	 */
	function setCompletion(key, checked) {
		const next = new Set(completionSet);
		if (checked) {
			next.add(key);
		} else {
			next.delete(key);
		}
		completionSet = next;
	}

	/**
	 * @param {string} key
	 * @returns {boolean}
	 */
	function isCompleted(key) {
		return completionSet.has(key);
	}

	/**
	 * @param {string | null | undefined} value
	 * @returns {string}
	 */
	function formatLikelihood(value) {
		const normalised = normaliseLookup(value);
		if (!normalised) return '';
		return normalised.charAt(0).toUpperCase() + normalised.slice(1);
	}

	const safetyNotes = $derived(() =>
		ensureArray(playbookPayload?.importantSafetyNotes).map(ensureString).filter(Boolean)
	);

	const actionSteps = $derived(() =>
		ensureArray(playbookPayload?.actionSteps)
			.map((step) => ({
				stepTitle: ensureString(step?.stepTitle),
				executionContext: ensureString(step?.executionContext),
				procedure: ensureArray(step?.procedure).map(ensureString).filter(Boolean),
				checklistItems: getInlineChecklist(step)
			}))
			.filter(
				(step) =>
					step.stepTitle ||
					step.executionContext ||
					step.procedure.length ||
					step.checklistItems.length
			)
	);

	const verificationSteps = $derived(() => getVerificationSteps(playbookPayload));

	const generalChecklists = $derived(() => getGeneralChecklists(playbookPayload));

	const hasPlaybookContent = $derived(
		() =>
			safetyNotes().length > 0 ||
			actionSteps().length > 0 ||
			verificationSteps().length > 0 ||
			generalChecklists().length > 0
	);

	const rawPlaybookJson = $derived(() => {
		if (typeof playbookOutput === 'string' && playbookOutput.trim().length > 0) {
			return playbookOutput.trim();
		}
		if (playbookPayload) {
			try {
				return JSON.stringify(playbookPayload, null, 2);
			} catch (error) {
				console.warn('Failed to serialise playbook payload:', error);
			}
		}
		return '';
	});

	const escalationSummary = $derived(() => ensureString(escalationPayload?.summary));
	const escalationLikelihoodValue = $derived(() =>
		ensureString(escalationPayload?.escalationLikelihood)
	);
	const escalationReasoning = $derived(() => ensureString(escalationPayload?.reasoning));
	const hasEscalationPayload = $derived(() => escalationSummary().length > 0);
	const formattedLikelihood = $derived(() => formatLikelihood(escalationLikelihoodValue()));

	const rawEscalationJson = $derived(() => {
		if (typeof escalationOutput === 'string' && escalationOutput.trim().length > 0) {
			return escalationOutput.trim();
		}
		if (escalationPayload) {
			try {
				return JSON.stringify(escalationPayload, null, 2);
			} catch (error) {
				console.warn('Failed to serialise escalation payload:', error);
			}
		}
		return '';
	});
</script>

{#if showAiPanel && selectedIncident}
	<div class="modal-overlay">
		<div class="ai-modal-container">
			<header class="ai-modal-header">
				<div>
					<h2>AI Co-pilot</h2>
					<p class="ai-incident-title">Analysing: {selectedIncident.title}</p>
				</div>
				<button class="close-btn" onclick={() => (showAiPanel = false)}>×</button>
			</header>

			<div class="ai-modal-content">
				<div class="ai-interface">
					<Avatar variant="ai" size="xl" fallback="AI">🤖</Avatar>
					<div class="ai-welcome">
						<p>
							I'm ready to help you resolve incident <strong>#{selectedIncident.id}</strong>. I can
							generate remediation playbooks and escalation summaries based on the incident details.
						</p>
					</div>
				</div>

				<div class="ai-actions">
					<Button loading={playbookLoading} onclick={() => onRequestGpt5('playbook')}>
						📋 Generate Playbook
					</Button>
					<Button
						variant="secondary"
						loading={escalationLoading}
						onclick={() => onRequestGpt5('escalation')}
					>
						📤 Draft Escalation
					</Button>
				</div>

				{#if errorObj}
					<div class="ai-error">
						<ErrorViewer {errorObj} onRetry={() => onRequestGpt5('playbook')} />
					</div>
				{/if}

				<div class="ai-outputs">
					<div class="ai-output-section">
						<h3>Remediation Playbook</h3>
						{#if playbookPayload && hasPlaybookContent()}
							<div class="playbook-layout">
								{#if safetyNotes().length}
									<section class="playbook-block">
										<h4>Important Safety Notes</h4>
										<ul class="bullet-list">
											{#each safetyNotes() as note}
												<li>{note}</li>
											{/each}
										</ul>
									</section>
								{/if}

								{#if actionSteps().length}
									<section class="playbook-block">
										<h4>Action Steps</h4>
										<div class="action-steps">
											{#each actionSteps() as step, index}
												{@const stepBaseKey = makeCompletionKey(
													'step',
													selectedIncident.id ?? 'current',
													index
												)}
												{@const inlineChecklist = step.checklistItems}
												{@const attachedChecklists = getRelatedChecklists(
													playbookPayload,
													step.stepTitle
												)}
												<article class="action-step">
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
															{#each step.procedure as instruction}
																<li>{instruction}</li>
															{/each}
														</ol>
													{/if}
													{#if inlineChecklist.length}
														<ul class="completion-list inline-checklist">
															{#each inlineChecklist as item, itemIndex}
																{@const itemKey = makeCompletionKey(
																	'inline',
																	stepBaseKey,
																	itemIndex
																)}
																<li class="completion-item" class:completed={isCompleted(itemKey)}>
																	<label>
																		<input
																			type="checkbox"
																			checked={isCompleted(itemKey)}
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
																				class:completed={isCompleted(itemKey)}
																			>
																				<label>
																					<input
																						type="checkbox"
																						checked={isCompleted(itemKey)}
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
												</article>
											{/each}
										</div>
									</section>
								{/if}

								{#if verificationSteps().length}
									<section class="playbook-block">
										<h4>Verification</h4>
										<ul class="completion-list verification-list">
											{#each verificationSteps() as step, index}
												{@const itemKey = makeCompletionKey(
													'verify',
													selectedIncident.id ?? 'current',
													index
												)}
												<li class="completion-item" class:completed={isCompleted(itemKey)}>
													<label>
														<input
															type="checkbox"
															checked={isCompleted(itemKey)}
															onchange={(event) =>
																setCompletion(itemKey, event.currentTarget.checked)}
														/>
														<span class="item-text">{step}</span>
													</label>
												</li>
											{/each}
										</ul>
									</section>
								{/if}

								{#if generalChecklists().length}
									<section class="playbook-block">
										<h4>Checklists</h4>
										<div class="checklist-grid">
											{#each generalChecklists() as checklist, listIndex}
												<div class="checklist-card">
													<h6>{checklist.title || 'Checklist'}</h6>
													<ul>
														{#each checklist.items as item, itemIndex}
															{@const itemKey = makeCompletionKey(
																'general',
																selectedIncident.id ?? 'current',
																listIndex,
																itemIndex
															)}
															<li
																class="completion-item checklist-item"
																class:completed={isCompleted(itemKey)}
															>
																<label>
																	<input
																		type="checkbox"
																		checked={isCompleted(itemKey)}
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
									</section>
								{/if}
							</div>
							{#if rawPlaybookJson().length}
								<div class="ai-output-toolbar">
									<button class="raw-toggle" onclick={() => (showRawPlaybook = !showRawPlaybook)}>
										{showRawPlaybook ? 'Hide raw JSON' : 'Show raw JSON'}
									</button>
								</div>
								{#if showRawPlaybook}
									<div class="ai-output-content">
										<pre><code>{rawPlaybookJson()}</code></pre>
									</div>
								{/if}
							{/if}
						{:else if rawPlaybookJson().length}
							<div class="ai-output-content">
								<pre><code>{rawPlaybookJson()}</code></pre>
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
						{#if hasEscalationPayload()}
							<div class="escalation-block">
								{#if formattedLikelihood()}
									<p
										class="escalation-likelihood"
										data-likelihood={escalationLikelihoodValue() || 'uncertain'}
									>
										Likelihood: <strong>{formattedLikelihood()}</strong>
									</p>
								{:else}
									<p class="escalation-likelihood" data-likelihood="uncertain">
										Likelihood: <strong>Uncertain</strong>
									</p>
								{/if}
								<p class="escalation-summary">{escalationSummary()}</p>
								{#if escalationReasoning().length}
									<div class="escalation-reasoning">
										<h4>Reasoning</h4>
										<p>{escalationReasoning()}</p>
									</div>
								{/if}
							</div>
							{#if rawEscalationJson().length}
								<div class="ai-output-toolbar">
									<button
										class="raw-toggle"
										onclick={() => (showRawEscalation = !showRawEscalation)}
									>
										{showRawEscalation ? 'Hide raw JSON' : 'Show raw JSON'}
									</button>
								</div>
								{#if showRawEscalation}
									<div class="ai-output-content">
										<pre><code>{rawEscalationJson()}</code></pre>
									</div>
								{/if}
							{/if}
						{:else if rawEscalationJson().length}
							<div class="ai-output-content">
								<pre><code>{rawEscalationJson()}</code></pre>
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
	/* AI Co-pilot Styles */
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

	.ai-modal-container {
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95));
		border: 1px solid rgba(148, 163, 184, 0.2);
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
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
	}

	.ai-modal-header h2 {
		font-size: 1.8rem;
		font-weight: 700;
		color: #f8fafc;
		margin: 0 0 0.5rem;
	}

	.ai-incident-title {
		color: #94a3b8;
		margin: 0;
		font-size: 1rem;
	}

	.close-btn {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		background: rgba(148, 163, 184, 0.2);
		color: #94a3b8;
		border-radius: 50%;
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #fecaca;
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
		background: rgba(30, 41, 59, 0.6);
		border-radius: 1.5rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
	}

	.ai-welcome {
		flex: 1;
	}

	.ai-welcome p {
		color: #cbd5e1;
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
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 1rem;
		padding: 1rem;
	}

	.ai-outputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.ai-output-section {
		background: rgba(30, 41, 59, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1.5rem;
		padding: 1.5rem;
	}

	.ai-output-section h3 {
		color: #f8fafc;
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0 0 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.playbook-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.playbook-block {
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.15);
		border-radius: 1rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.playbook-block h4 {
		margin: 0;
		color: #e2e8f0;
		font-size: 1.05rem;
	}

	.playbook-block h6 {
		margin: 0;
		color: #e0f2fe;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.bullet-list {
		margin: 0;
		padding-left: 1.25rem;
		color: #cbd5e1;
		line-height: 1.5;
	}

	.action-steps {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.step-header {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.step-index {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 9999px;
		background: rgba(59, 130, 246, 0.25);
		color: #bfdbfe;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
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

	.action-step ol {
		margin: 0;
		padding-left: 1.35rem;
		color: #cbd5e1;
		line-height: 1.5;
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

	.checklist-grid {
		display: grid;
		gap: 0.75rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.checklist-card {
		background: rgba(10, 16, 32, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.15);
		border-radius: 0.9rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.checklist-card.inline {
		background: rgba(15, 23, 42, 0.4);
		border-style: dashed;
	}

	.checklist-card ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	.verification-list {
		margin: 0;
	}

	.escalation-block {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.escalation-summary {
		margin: 0;
		color: #e2e8f0;
		line-height: 1.6;
	}

	.escalation-reasoning {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: rgba(15, 23, 42, 0.35);
		border: 1px solid rgba(148, 163, 184, 0.18);
		border-radius: 0.75rem;
		padding: 0.75rem 0.9rem;
	}

	.escalation-reasoning h4 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: #e0f2fe;
	}

	.escalation-reasoning p {
		margin: 0;
		color: #94a3b8;
		line-height: 1.6;
	}

	.escalation-likelihood {
		margin: 0;
		font-size: 0.9rem;
		color: #bfdbfe;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.ai-output-toolbar {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.raw-toggle {
		background: rgba(59, 130, 246, 0.2);
		border: 1px solid rgba(59, 130, 246, 0.35);
		color: #bfdbfe;
		border-radius: 9999px;
		padding: 0.4rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.2s ease,
			border 0.2s ease,
			color 0.2s ease;
	}

	.raw-toggle:hover {
		background: rgba(59, 130, 246, 0.3);
		border-color: rgba(59, 130, 246, 0.5);
		color: #e0f2fe;
	}

	.ai-output-content {
		background: rgba(15, 23, 42, 0.8);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1rem;
		padding: 1.5rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.ai-output-content pre {
		margin: 0;
		white-space: pre-wrap;
		word-wrap: break-word;
		color: #e2e8f0;
		line-height: 1.6;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.9rem;
	}

	.ai-placeholder {
		text-align: center;
		padding: 2rem;
		color: #94a3b8;
	}

	.ai-placeholder p {
		margin: 0;
		font-style: italic;
		line-height: 1.5;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.ai-modal-container {
			margin: 1rem;
			width: calc(100vw - 2rem);
		}

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

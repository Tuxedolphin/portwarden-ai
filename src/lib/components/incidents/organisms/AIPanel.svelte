<script>
	import { Button, Avatar } from '$lib/components/ui';
	import ErrorViewer from '$lib/ErrorViewer.svelte';

	let {
		selectedIncident,
		showAiPanel = $bindable(),
		playbookOutput = $bindable(''),
		playbookPayload = $bindable(null),
		escalationOutput = $bindable(''),
		playbookLoading = $bindable(false),
		escalationLoading = $bindable(false),
		errorObj = $bindable(null),
		onRequestGpt5
	} = $props();

	let showRawPlaybook = $state(false);

	$effect(() => {
		playbookPayload;
		showRawPlaybook = false;
	});

	/**
	 * @param {import('$lib/types/playbook').PlaybookPayload | null} payload
	 */
	function buildLanguageCommandGroups(payload) {
		if (!payload) return [];
		const map = new Map();
		for (const entry of payload.languageCommands) {
			if (!entry || typeof entry.language !== 'string' || typeof entry.command !== 'string') {
				continue;
			}
			const key = entry.language;
			if (!map.has(key)) {
				map.set(key, []);
			}
			map.get(key).push(entry.command);
		}
		return Array.from(map, ([language, commands]) => ({ language, commands })).sort((a, b) =>
			a.language.localeCompare(b.language)
		);
	}
</script>

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
						{#if playbookPayload}
							<div class="playbook-layout">
								<section class="playbook-block">
									<h4>Important Safety Notes</h4>
									<ul class="bullet-list">
										{#each playbookPayload.importantSafetyNotes as note}
											<li>{note}</li>
										{/each}
									</ul>
								</section>

								<section class="playbook-block">
									<h4>Action Steps</h4>
									<div class="steps">
										{#each playbookPayload.actionSteps as step, index}
											<article class="step-card">
												<div class="step-header">
													<span class="step-index">{index + 1}</span>
													<div>
														<h5>{step.stepTitle}</h5>
														<p>{step.executionContext}</p>
													</div>
												</div>
												<ol class="step-procedure">
													{#each step.procedure as instruction}
														<li>{instruction}</li>
													{/each}
												</ol>
											</article>
										{/each}
									</div>
								</section>

								<section class="playbook-block">
									<h4>Language Commands</h4>
									<div class="command-groups">
										{#each buildLanguageCommandGroups(playbookPayload) as group}
											<div class="command-card">
												<h5>{group.language ? group.language.toUpperCase() : 'COMMANDS'}</h5>
												{#each group.commands as command}
													<pre><code>{command}</code></pre>
												{/each}
											</div>
										{/each}
									</div>
								</section>

								<section class="playbook-block">
									<h4>Checklists</h4>
									<div class="checklists">
										{#each playbookPayload.checklists as checklist}
											<article class="checklist-card">
												<h5>{checklist.title}</h5>
												<ul class="checklist-list">
													{#each checklist.items as item}
														<li>{item}</li>
													{/each}
												</ul>
											</article>
										{/each}
									</div>
								</section>
							</div>
							<div class="ai-output-toolbar">
								<button class="raw-toggle" onclick={() => (showRawPlaybook = !showRawPlaybook)}>
									{showRawPlaybook ? 'Hide raw JSON' : 'Show raw JSON'}
								</button>
							</div>
							{#if showRawPlaybook}
								<div class="ai-output-content">
									<pre><code>{playbookOutput || JSON.stringify(playbookPayload, null, 2)}</code
										></pre>
								</div>
							{/if}
						{:else if playbookOutput}
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

	.playbook-block h5 {
		margin: 0;
		color: #f8fafc;
		font-size: 0.95rem;
	}

	.bullet-list {
		margin: 0;
		padding-left: 1.25rem;
		color: #cbd5e1;
		line-height: 1.5;
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.step-card {
		background: rgba(10, 16, 32, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.1);
		border-radius: 0.9rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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

	.step-header p {
		margin: 0.25rem 0 0;
		color: #94a3b8;
		font-size: 0.85rem;
	}

	.step-procedure {
		margin: 0;
		padding-left: 1.25rem;
		color: #cbd5e1;
		line-height: 1.5;
	}

	.command-groups {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.command-card {
		background: rgba(10, 16, 32, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.1);
		border-radius: 0.9rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.command-card pre {
		margin: 0;
		background: rgba(15, 23, 42, 0.9);
		border: 1px solid rgba(148, 163, 184, 0.12);
		border-radius: 0.6rem;
		padding: 0.75rem;
		font-size: 0.85rem;
		color: #e2e8f0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.checklists {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.checklist-card {
		background: rgba(10, 16, 32, 0.6);
		border: 1px solid rgba(148, 163, 184, 0.1);
		border-radius: 0.9rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.checklist-list {
		margin: 0;
		padding-left: 1.25rem;
		color: #cbd5e1;
		line-height: 1.5;
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

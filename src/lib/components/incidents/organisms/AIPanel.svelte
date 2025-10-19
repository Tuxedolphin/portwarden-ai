<script>
	import { Button, Avatar } from '$lib/components/ui';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	
	let { 
		selectedIncident,
		showAiPanel = $bindable(),
		playbookOutput = $bindable(''),
		escalationOutput = $bindable(''),
		playbookLoading = $bindable(false),
		escalationLoading = $bindable(false),
		errorObj = $bindable(null),
		onRequestGpt5
	} = $props();
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
						onclick={() => onRequestGpt5('playbook')}
					>
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
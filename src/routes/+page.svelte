<script>
	import { incidents } from '$lib/data/incidents';
	import { impactHighlights, layers } from '$lib/data/architecture';

	const severityPalette = {
		Critical: 'critical',
		High: 'high',
		Medium: 'medium',
		Low: 'low'
	};

	const syntaxMap = {
		sql: 'sql',
		command: 'bash',
		template: 'text'
	};

	let selectedIncident = incidents[0];
	let playbookOutput = '';
	let escalationOutput = '';
	let playbookLoading = false;
	let escalationLoading = false;
	let toast = '';

	function selectIncident(incident) {
		selectedIncident = incident;
		playbookOutput = '';
		escalationOutput = '';
		toast = '';
	}

	function formatTimestamp(value) {
		if (!value) return 'n/a';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleString('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'UTC'
		});
	}

	async function requestGemini(intent) {
		if (!selectedIncident) return;
		toast = '';
		try {
			if (intent === 'playbook') {
				playbookLoading = true;
			} else {
				escalationLoading = true;
			}

			const response = await fetch('/api/gemini', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ incidentId: selectedIncident.id, intent })
			});

			const payload = await response.json();

			if (!response.ok) {
				throw new Error(payload.error ?? 'Gemini request failed');
			}

			if (intent === 'playbook') {
				playbookOutput = payload.output;
			} else {
				escalationOutput = payload.output;
			}
		} catch (error) {
			toast = error instanceof Error ? error.message : 'Unexpected error from Gemini API';
		} finally {
			playbookLoading = false;
			escalationLoading = false;
		}
	}
</script>

<div class="hero">
	<div>
		<h1>Portwarden AI</h1>
		<p class="tagline">Intelligent oversight for maritime operations.</p>
	</div>
	<div class="hero-meta">
		<span class="label">Hackathon prototype</span>
		<span class="meta">Powered by Gemini + SvelteKit</span>
	</div>
</div>

<section class="metrics">
	{#each impactHighlights as highlight}
		<div class="metric-card">
			<h3>{highlight.value}</h3>
			<p>{highlight.label}</p>
			<span>{highlight.subtext}</span>
		</div>
	{/each}
</section>

<section class="layers">
	{#each layers as layer}
		<article class="layer-card" id={layer.id}>
			<span class="layer-kicker">{layer.kicker}</span>
			<h2>{layer.title}</h2>
			<p>{layer.description}</p>
		</article>
	{/each}
</section>

<main class="workspace">
	<aside class="incident-list">
		<header>
			<h2>Live incidents</h2>
			<p>Auto-prioritized by severity and operational impact.</p>
		</header>
		<ul>
			{#each incidents as incident}
				<li>
					<button
						type="button"
						class:selected={incident.id === selectedIncident.id}
						on:click={() => selectIncident(incident)}
					>
						<div class="id-row">
							<span>{incident.displayId}</span>
							<span class={`badge ${severityPalette[incident.severity] ?? 'medium'}`}
								>{incident.severity}</span
							>
						</div>
						<h3>{incident.title}</h3>
						<p>{incident.summary}</p>
					</button>
				</li>
			{/each}
		</ul>
	</aside>

	<section class="incident-detail">
		<header class="detail-header">
			<div>
				<h2>{selectedIncident.displayId}</h2>
				<p>{selectedIncident.title}</p>
			</div>
			<div class="detail-meta">
				<span>{selectedIncident.channel}</span>
				<span>{selectedIncident.persona}</span>
				<span>{formatTimestamp(selectedIncident.occurredAt)}</span>
			</div>
		</header>

		{#if toast}
			<div class="toast">{toast}</div>
		{/if}

		<div class="detail-grid">
			<section class="panel">
				<h3>Layer 1 · Unified Ingestion</h3>
				<ul>
					{#each selectedIncident.ingestion as item}
						<li>
							<span>{item.label}</span>
							<strong>{item.value}</strong>
						</li>
					{/each}
				</ul>
			</section>
			<section class="panel">
				<h3>Layer 2 · Correlation Evidence</h3>
				<ul>
					{#each selectedIncident.correlatedEvidence as evidence}
						<li>
							<header>
								<strong>{evidence.source}</strong>
								<span>{formatTimestamp(evidence.timestamp)}</span>
							</header>
							<p>{evidence.message}</p>
							{#if evidence.insight}
								<small>{evidence.insight}</small>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
			<section class="panel knowledge">
				<h3>Layer 2 · Knowledge Base hits</h3>
				<ul>
					{#each selectedIncident.knowledgeBase as article}
						<li>
							<strong>[{article.reference}] {article.title}</strong>
							<p>{article.summary}</p>
						</li>
					{/each}
				</ul>
			</section>
		</div>

		<section class="actions">
			<h3>Layer 3 · Guided remediation</h3>
			{#each selectedIncident.recommendedActions as action, index}
				<article class="action-card">
					<header>
						<span class="step">Step {index + 1}</span>
						<h4>{action.label}</h4>
						<span class="cite">[{action.cite}]</span>
					</header>
					<p>{action.explanation}</p>
					<pre>
						<code class={`language-${syntaxMap[action.artifactType] ?? 'text'}`}>{action.artifact}</code>
					</pre>
				</article>
			{/each}
		</section>

		<section class="co-pilot">
			<h3>Gemini co-pilot output</h3>
			<div class="buttons">
				<button type="button" disabled={playbookLoading} on:click={() => requestGemini('playbook')}>
					{playbookLoading ? 'Generating playbook…' : 'Generate playbook'}
				</button>
				<button
					type="button"
					disabled={escalationLoading}
					on:click={() => requestGemini('escalation')}
				>
					{escalationLoading ? 'Drafting escalation…' : 'Draft escalation summary'}
				</button>
			</div>
			<div class="generated">
				<article>
					<h4>Playbook draft</h4>
					{#if playbookOutput}
						<pre><code>{playbookOutput}</code></pre>
					{:else}
						<p class="placeholder">
							Request a Gemini playbook to see an action plan for this incident.
						</p>
					{/if}
				</article>
				<article>
					<h4>Escalation brief</h4>
					{#if escalationOutput}
						<pre><code>{escalationOutput}</code></pre>
					{:else}
						<p class="placeholder">
							Draft a bridge-ready summary when leadership updates are required.
						</p>
					{/if}
				</article>
			</div>
		</section>

		<section class="escalation">
			<h3>Escalation posture</h3>
			<p>{selectedIncident.escalation.summary}</p>
			{#if selectedIncident.escalation.required}
				<ul>
					<li><strong>Owner:</strong> {selectedIncident.escalation.owner}</li>
					<li><strong>Team:</strong> {selectedIncident.escalation.team}</li>
					<li><strong>Channel:</strong> {selectedIncident.escalation.channel}</li>
					{#if selectedIncident.escalation.escalationNote}
						<li><strong>Quick note:</strong> {selectedIncident.escalation.escalationNote}</li>
					{/if}
				</ul>
			{/if}
		</section>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family:
			'Inter',
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
		background: #0f172a;
		color: #f8fafc;
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	.hero {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin: 2.5rem auto 1.5rem;
		max-width: 1100px;
	}

	.hero h1 {
		margin: 0;
		font-size: 2.75rem;
		letter-spacing: -0.02em;
	}

	.tagline {
		margin: 0.4rem 0 0;
		color: #94a3b8;
		font-size: 1.1rem;
	}

	.hero-meta {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		align-items: flex-end;
		color: #cbd5f5;
	}

	.hero-meta .label {
		padding: 0.25rem 0.75rem;
		border: 1px solid rgba(148, 163, 184, 0.4);
		border-radius: 999px;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.hero-meta .meta {
		font-size: 0.85rem;
		color: #94a3b8;
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin: 0 auto 2rem;
		max-width: 1100px;
	}

	.metric-card {
		padding: 1.5rem;
		border-radius: 1rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9));
		border: 1px solid rgba(148, 163, 184, 0.15);
		box-shadow: 0 20px 40px -20px rgba(15, 23, 42, 0.75);
	}

	.metric-card h3 {
		margin: 0 0 0.4rem;
		font-size: 1.75rem;
	}

	.metric-card p {
		margin: 0;
		color: #cbd5f5;
		font-weight: 500;
	}

	.metric-card span {
		display: block;
		margin-top: 0.35rem;
		color: #94a3b8;
		font-size: 0.85rem;
	}

	.layers {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.25rem;
		margin: 0 auto 2.5rem;
		max-width: 1100px;
	}

	.layer-card {
		padding: 1.75rem;
		border-radius: 1.25rem;
		background: rgba(15, 23, 42, 0.7);
		border: 1px solid rgba(148, 163, 184, 0.2);
		position: relative;
		overflow: hidden;
	}

	.layer-card::after {
		content: '';
		position: absolute;
		width: 120px;
		height: 120px;
		right: -40px;
		bottom: -40px;
		background: radial-gradient(circle at center, rgba(59, 130, 246, 0.35), transparent);
	}

	.layer-kicker {
		display: inline-block;
		margin-bottom: 0.6rem;
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #60a5fa;
	}

	.layer-card h2 {
		margin: 0 0 0.6rem;
		font-size: 1.35rem;
	}

	.layer-card p {
		margin: 0;
		color: #cbd5f5;
		line-height: 1.5;
	}

	.workspace {
		display: grid;
		grid-template-columns: 320px 1fr;
		gap: 1.5rem;
		margin: 0 auto 4rem;
		max-width: 1100px;
	}

	.incident-list {
		background: rgba(15, 23, 42, 0.65);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1.25rem;
		padding: 1.5rem;
		position: sticky;
		top: 1.5rem;
		height: fit-content;
	}

	.incident-list header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.incident-list header p {
		margin: 0.35rem 0 1rem;
		color: #94a3b8;
		font-size: 0.9rem;
	}

	.incident-list ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.incident-list button {
		width: 100%;
		text-align: left;
		padding: 1rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1rem;
		background: rgba(15, 23, 42, 0.55);
		color: inherit;
		cursor: pointer;
		transition:
			border 0.2s ease,
			transform 0.2s ease;
		font: inherit;
	}

	.incident-list button:hover {
		transform: translateY(-2px);
		border-color: rgba(99, 102, 241, 0.6);
	}

	.incident-list button.selected {
		border-color: rgba(59, 130, 246, 0.8);
		background: rgba(37, 99, 235, 0.25);
	}

	.incident-list button h3 {
		margin: 0.35rem 0;
		font-size: 1rem;
	}

	.incident-list button p {
		margin: 0;
		color: #94a3b8;
		font-size: 0.85rem;
	}

	.id-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		color: #cbd5f5;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.1rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.badge.critical {
		background: rgba(239, 68, 68, 0.2);
		color: #fca5a5;
	}

	.badge.high {
		background: rgba(249, 115, 22, 0.2);
		color: #fb923c;
	}

	.badge.medium {
		background: rgba(250, 204, 21, 0.15);
		color: #fcd34d;
	}

	.badge.low {
		background: rgba(34, 197, 94, 0.2);
		color: #86efac;
	}

	.incident-detail {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		background: rgba(15, 23, 42, 0.7);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1.25rem;
		padding: 1.5rem;
	}

	.detail-header h2 {
		margin: 0;
		font-size: 1.6rem;
	}

	.detail-header p {
		margin: 0.4rem 0 0;
		color: #cbd5f5;
	}

	.detail-meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.9rem;
		color: #94a3b8;
	}

	.toast {
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(248, 113, 113, 0.3);
		color: #fecaca;
		font-size: 0.9rem;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.25rem;
	}

	.panel {
		padding: 1.25rem;
		border-radius: 1.15rem;
		background: rgba(15, 23, 42, 0.65);
		border: 1px solid rgba(148, 163, 184, 0.18);
		min-height: 220px;
	}

	.panel h3 {
		margin: 0 0 0.9rem;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #60a5fa;
	}

	.panel ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.panel li {
		border-left: 2px solid rgba(59, 130, 246, 0.4);
		padding-left: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		color: #cbd5f5;
	}

	.panel li span {
		color: #94a3b8;
		font-size: 0.85rem;
	}

	.panel li small {
		color: #94a3b8;
		font-size: 0.8rem;
	}

	.panel.knowledge li {
		border-left-color: rgba(16, 185, 129, 0.5);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.actions h3 {
		margin: 0;
		font-size: 1.1rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #34d399;
	}

	.action-card {
		padding: 1.25rem;
		border-radius: 1.1rem;
		background: rgba(15, 23, 42, 0.65);
		border: 1px solid rgba(148, 163, 184, 0.18);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.action-card header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.action-card .step {
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: rgba(59, 130, 246, 0.2);
		color: #bfdbfe;
		font-size: 0.75rem;
		text-transform: uppercase;
	}

	.action-card h4 {
		margin: 0;
		font-size: 1.05rem;
	}

	.action-card .cite {
		margin-left: auto;
		color: #94a3b8;
		font-size: 0.85rem;
	}

	.action-card pre {
		margin: 0;
		padding: 0.75rem;
		border-radius: 0.85rem;
		background: rgba(15, 23, 42, 0.9);
		border: 1px solid rgba(148, 163, 184, 0.25);
		color: #e2e8f0;
		font-size: 0.85rem;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.co-pilot {
		padding: 1.5rem;
		border-radius: 1.25rem;
		background: rgba(15, 23, 42, 0.7);
		border: 1px solid rgba(148, 163, 184, 0.2);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.co-pilot h3 {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #93c5fd;
	}

	.buttons {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.buttons button {
		padding: 0.65rem 1.2rem;
		border-radius: 0.85rem;
		border: none;
		background: linear-gradient(135deg, #2563eb, #3b82f6);
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.buttons button[disabled] {
		opacity: 0.6;
		cursor: progress;
		transform: none;
		box-shadow: none;
	}

	.buttons button:not([disabled]):hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 24px -18px rgba(59, 130, 246, 0.8);
	}

	.generated {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
	}

	.generated article {
		padding: 1rem;
		border-radius: 1rem;
		background: rgba(30, 41, 59, 0.7);
		border: 1px solid rgba(148, 163, 184, 0.2);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.generated h4 {
		margin: 0;
		font-size: 1rem;
	}

	.generated pre {
		margin: 0;
		padding: 0.75rem;
		background: rgba(15, 23, 42, 0.85);
		border-radius: 0.75rem;
		border: 1px solid rgba(148, 163, 184, 0.25);
		color: #f8fafc;
		font-size: 0.85rem;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.placeholder {
		margin: 0;
		color: #64748b;
		font-size: 0.85rem;
	}

	.escalation {
		padding: 1.25rem;
		border-radius: 1.1rem;
		background: rgba(15, 23, 42, 0.65);
		border: 1px solid rgba(148, 163, 184, 0.2);
		margin-bottom: 2rem;
	}

	.escalation h3 {
		margin: 0 0 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #f9a8d4;
	}

	.escalation p {
		margin: 0 0 0.6rem;
		color: #cbd5f5;
	}

	.escalation ul {
		margin: 0;
		padding-left: 1rem;
		color: #94a3b8;
		font-size: 0.9rem;
		line-height: 1.6;
	}

	@media (max-width: 960px) {
		.hero {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.workspace {
			grid-template-columns: 1fr;
		}

		.incident-list {
			position: static;
		}

		.detail-header {
			flex-direction: column;
			gap: 0.75rem;
			align-items: flex-start;
		}

		.detail-meta {
			flex-wrap: wrap;
		}
	}
</style>

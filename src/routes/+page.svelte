<script>
	import { incidents } from '$lib/data/incidents';
	import { impactHighlights, layers } from '$lib/data/architecture';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { translateError } from '$lib/errorTranslator';
	import { onMount } from 'svelte';
	export let data;

	/** @type {{ title?: string, message?: string, code?: string, steps?: string[], detailsPages?: string[] } | null} */
	let errorObj = null;

	/** @type {{ result?: { notes?: any[]; steps?: any[]; code_to_be_ran?: any[]; checklists?: any[] } } | null} */
	let threadInit = null;
	let threadError = '';
	let threadLoading = false;

	$: threadNotes = Array.isArray(threadInit?.result?.notes) ? threadInit.result.notes : [];
	$: threadSteps = Array.isArray(threadInit?.result?.steps) ? threadInit.result.steps : [];
	$: threadCode = Array.isArray(threadInit?.result?.code_to_be_ran)
		? threadInit.result.code_to_be_ran
		: [];
	$: threadChecklists = Array.isArray(threadInit?.result?.checklists)
		? threadInit.result.checklists
		: [];

	async function initializeThread() {
		threadLoading = true;
		threadError = '';
		try {
			const response = await fetch('/api/gpt5/thread', { method: 'POST' });
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data?.error || 'Failed to initialize AI thread');
			}
			threadInit = data;
		} catch (error) {
			threadError = error instanceof Error ? error.message : 'Unable to initialize AI thread';
			console.error('Thread initialization failed:', error);
		} finally {
			threadLoading = false;
		}
	}

	let scrollY = 0;
	let innerHeight = 0;

	// Counter animation state
	let teusProcessed = 0;
	let responseTime = 0;
	let mounted = false;

	const severityPalette = {
		Critical: 'critical',
		High: 'high',
		Medium: 'medium',
		Low: 'low'
	};

	/** @param {string|undefined} key */
	function safeSeverity(key) {
		if (!key) return 'medium';
		if (key === 'Critical') return severityPalette.Critical;
		if (key === 'High') return severityPalette.High;
		if (key === 'Medium') return severityPalette.Medium;
		if (key === 'Low') return severityPalette.Low;
		return 'medium';
	}

	/** @param {any} value */
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

	/** @param {number} target @param {number} duration @param {(value: number) => void} callback */
	function animateCounter(target, duration, callback) {
		const start = performance.now();
		const startValue = 0;

		/** @param {number} timestamp */
		function update(timestamp) {
			const elapsed = timestamp - start;
			const progress = Math.min(elapsed / duration, 1);

			// Smoother easing function
			const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
			const current = startValue + (target - startValue) * easeOutExpo;

			callback(current);

			if (progress < 1) {
				requestAnimationFrame(update);
			} else {
				// Ensure we end exactly on the target value
				callback(target);
			}
		}

		requestAnimationFrame(update);
	}

	onMount(() => {
		initializeThread();
		mounted = true;

		// Start counter animations with less staggered delays for smoother feel
		setTimeout(() => {
			animateCounter(10, 1800, (value) => {
				teusProcessed = value;
			});
		}, 300);

		setTimeout(() => {
			animateCounter(2, 2000, (value) => {
				responseTime = value;
			});
		}, 600);
	});
</script>

<svelte:window bind:scrollY bind:innerHeight />

<Header />

<!-- Hero Section with Parallax -->
<section class="hero-section" style="--scroll-y: {scrollY}px">
	<div class="hero-content">
		<div class="hero-text">
			<h1>Portwarden AI</h1>
			<p class="tagline">Intelligent oversight for maritime operations.</p>
			<div class="hero-stats">
				<div class="stat">
					<span class="stat-number">
						{#if teusProcessed < 1}
							0M
						{:else if teusProcessed < 10}
							{Math.floor(teusProcessed)}M
						{:else}
							{Math.floor(teusProcessed)}M+
						{/if}
					</span>
					<span class="stat-label">TEU Processed</span>
				</div>
				<div class="stat">
					<span class="stat-number">24/7</span>
					<span class="stat-label">Monitoring</span>
				</div>
				<div class="stat">
					<span class="stat-number">
						{#if responseTime < 0.1}
							&lt;1min
						{:else if responseTime < 2}
							&lt;{Math.floor(responseTime) || 1}min
						{:else}
							&lt;{Math.floor(responseTime)}min
						{/if}
					</span>
					<span class="stat-label">Response Time</span>
				</div>
			</div>
		</div>
	</div>
	<div class="scroll-indicator">
		<div class="scroll-arrow"></div>
	</div>
</section>

<section class="ai-briefing-section">
	<div class="ai-briefing-container">
		<div class="section-header">
			<h2 class="section-title">AI Safety Briefing</h2>
			<p class="section-subtitle">
				Automated guidance generated from operational references at session start
			</p>
		</div>

		{#if threadLoading}
			<div class="ai-briefing-card loading">Initializing co-pilot briefing...</div>
		{:else if threadError}
			<div class="ai-briefing-card error">{threadError}</div>
		{:else if threadInit}
			<div class="ai-briefing-grid">
				<div class="ai-briefing-card">
					<h3>Important Safety Notes</h3>
					{#if threadNotes.length === 0}
						<p class="placeholder">No safety notes returned.</p>
					{:else}
						<ul>
							{#each threadNotes as note}
								<li>{note}</li>
							{/each}
						</ul>
					{/if}
				</div>

				<div class="ai-briefing-card">
					<h3>Action Steps</h3>
					{#if threadSteps.length === 0}
						<p class="placeholder">No action steps provided.</p>
					{:else}
						<ol>
							{#each threadSteps as step, index}
								<li>
									{#if typeof step === 'string'}
										{step}
									{:else}
										<strong>{step.title ?? `Step ${index + 1}`}</strong>
										{#if step.description}
											<div class="step-detail">{step.description}</div>
										{/if}
										{#if step.location || step.execution_context}
											<span class="step-tag">Run in {step.location ?? step.execution_context}</span>
										{/if}
									{/if}
								</li>
							{/each}
						</ol>
					{/if}
				</div>

				<div class="ai-briefing-card">
					<h3>Code to Execute</h3>
					{#if threadCode.length === 0}
						<p class="placeholder">No execution scripts identified.</p>
					{:else}
						<ul class="code-list">
							{#each threadCode as item}
								<li>
									<div class="code-language">{item.language ?? 'Unspecified'}</div>
									<div class="code-actions">
										{item.actions ?? item.details ?? item.description ?? ''}
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				<div class="ai-briefing-card">
					<h3>Verification Checklists</h3>
					{#if threadChecklists.length === 0}
						<p class="placeholder">No verification checklist supplied.</p>
					{:else}
						<ul>
							{#each threadChecklists as item}
								<li>{item}</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{:else}
			<div class="ai-briefing-card placeholder">Awaiting AI briefing.</div>
		{/if}
	</div>
</section>

<!-- Operations Overview -->
<section class="operations-section">
	<div class="operations-content">
		<div class="section-header">
			<h2 class="section-title">Port Operations Intelligence</h2>
			<p class="section-subtitle">
				Real-time monitoring and AI-powered insights for maritime operations
			</p>
		</div>

		<div class="metrics-grid">
			{#each impactHighlights as highlight}
				<div class="metric-card">
					<h3 class="metric-value">{highlight.value}</h3>
					<p class="metric-label">{highlight.label}</p>
					<span class="metric-change">{highlight.subtext}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Technology Layers -->
<section class="tech-section">
	<div class="tech-content">
		<div class="section-header">
			<h2 class="section-title">AI-Powered Maritime Technology</h2>
			<p class="section-subtitle">Three-layer architecture for comprehensive port management</p>
		</div>

		<div class="tech-grid">
			{#each layers as layer, index}
				<div class="tech-card" style="animation-delay: {index * 0.2}s">
					<div class="tech-badge">Layer 0{index + 1}</div>
					<div class="layer-content">
						<h3>{layer.title}</h3>
						<p>{layer.description}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

{#if data?.user}
	<!-- Live Incidents Dashboard -->
	<section class="incidents-section">
		<div class="incidents-content">
			<div class="section-header">
				<h2 class="section-title">Live Incidents Dashboard</h2>
				<p class="section-subtitle">Real-time incident monitoring and AI-powered assistance</p>
			</div>

			<div class="dashboard-grid">
				<div class="incident-sidebar">
					<div class="panel-header">
						<h3>Live Incidents</h3>
						<span class="incident-count">{incidents.length} Active</span>
					</div>

					<div class="incident-list-items">
						{#each incidents.slice(0, 5) as incident}
							<div class="incident-item">
								<div class="incident-header">
									<span class="incident-id">{incident.displayId}</span>
									<span class="severity-badge {safeSeverity(incident.severity)}"
										>{incident.severity}</span
									>
								</div>
								<h4 class="incident-title">{incident.title}</h4>
								<p class="incident-summary">{incident.summary}</p>
								<div class="incident-meta">
									<span>🕐 {formatTimestamp(incident.occurredAt) || 'Just now'}</span>
									<span>📍 {incident.channel || 'Port Authority'}</span>
								</div>
							</div>
						{/each}
					</div>

					<a href="/incidents" class="view-all-btn">View All Incidents →</a>
				</div>

				<div class="incident-detail-panel">
					<div class="panel-header">
						<h3>Port Operations Overview</h3>
						<div class="status-indicator online">System Online</div>
					</div>

					<div class="operations-overview">
						<div class="overview-grid">
							<div class="overview-stat">
								<h4>Active Vessels</h4>
								<span class="overview-value">47</span>
								<span class="overview-trend">+3 today</span>
							</div>
							<div class="overview-stat">
								<h4>Cargo Throughput</h4>
								<span class="overview-value">12.4K</span>
								<span class="overview-trend">TEU today</span>
							</div>
							<div class="overview-stat">
								<h4>System Health</h4>
								<span class="overview-value">98.7%</span>
								<span class="overview-trend">Uptime</span>
							</div>
							<div class="overview-stat">
								<h4>Response Time</h4>
								<span class="overview-value">&lt;2min</span>
								<span class="overview-trend">Average</span>
							</div>
						</div>

						<div class="next-actions">
							<h4>Quick Actions</h4>
							<div class="action-grid">
								<a href="/incidents" class="quick-action">Manage Incidents</a>
								<a href="/archive" class="quick-action">View Archive</a>
								<button class="quick-action">Generate Report</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{/if}

{#if errorObj}
	<div class="error-section">
		<div class="container">
			<ErrorViewer {errorObj} onRetry={() => (errorObj = null)} />
		</div>
	</div>
{/if}

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
		background: #0a0f1c;
		color: #f8fafc;
		overflow-x: hidden;
	}

	:global(*) {
		box-sizing: border-box;
	}

	/* Hero Section with Parallax */
	.hero-section {
		position: relative;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			180deg,
			rgba(10, 15, 28, 0.2) 0%,
			rgba(10, 15, 28, 0.7) 50%,
			rgba(10, 15, 28, 0.95) 100%
		);
		z-index: 2;
	}

	.hero-section::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('/images/wideangle.jpg') center/cover no-repeat;
		transform: translateY(calc(var(--scroll-y, 0px) * 0.5));
		will-change: transform;
		z-index: 1;
	}

	.hero-content {
		position: relative;
		z-index: 3;
		text-align: center;
		max-width: 900px;
		padding: 2rem;
	}

	.ai-briefing-section {
		padding: 4rem 2rem;
		background: linear-gradient(180deg, #0a0f1c 0%, #111c31 100%);
	}

	.ai-briefing-container {
		max-width: 1100px;
		margin: 0 auto;
	}

	.ai-briefing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
	}

	.ai-briefing-card {
		background: rgba(15, 23, 42, 0.65);
		border: 1px solid rgba(96, 165, 250, 0.18);
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 18px 45px rgba(15, 23, 42, 0.35);
		backdrop-filter: blur(12px);
		color: #e2e8f0;
	}

	.ai-briefing-card h3 {
		margin-top: 0;
		margin-bottom: 0.75rem;
		font-size: 1.1rem;
		font-weight: 600;
		color: #f8fafc;
	}

	.ai-briefing-card.loading,
	.ai-briefing-card.error,
	.ai-briefing-card.placeholder {
		text-align: center;
		font-size: 1rem;
	}

	.ai-briefing-card.error {
		border-color: rgba(248, 113, 113, 0.4);
		color: #fecaca;
	}

	.ai-briefing-card ul,
	.ai-briefing-card ol {
		margin: 0;
		padding-left: 1.1rem;
		color: #cbd5e1;
	}

	.ai-briefing-card li + li {
		margin-top: 0.65rem;
	}

	.placeholder {
		color: #94a3b8;
		font-style: italic;
	}

	.step-detail {
		margin-top: 0.35rem;
		color: #94a3b8;
		font-size: 0.95rem;
	}

	.step-tag {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		background: rgba(59, 130, 246, 0.2);
		color: #bfdbfe;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.code-list {
		list-style: none;
		padding-left: 0;
	}

	.code-list li + li {
		margin-top: 1rem;
	}

	.code-language {
		font-weight: 600;
		color: #60a5fa;
	}

	.code-actions {
		margin-top: 0.35rem;
		font-size: 0.95rem;
		color: #cbd5e1;
	}

	.hero-content h1 {
		font-size: 4rem;
		font-weight: 800;
		margin: 0 0 1rem;
		background: linear-gradient(135deg, #60a5fa, #34d399, #fbbf24);
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		text-shadow: 0 0 40px rgba(96, 165, 250, 0.3);
		letter-spacing: -0.02em;
	}

	.hero-tagline {
		font-size: 1.5rem;
		color: #cbd5e1;
		margin: 0 0 2rem;
		font-weight: 300;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}

	.hero-meta {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 3rem;
		flex-wrap: wrap;
	}

	.hero-stat {
		text-align: center;
		padding: 1rem 2rem;
		background: rgba(30, 41, 59, 0.4);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1rem;
		backdrop-filter: blur(10px);
	}

	.hero-stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: #60a5fa;
		display: block;
	}

	.hero-stat-label {
		font-size: 0.9rem;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	/* Operations Overview */
	.operations-section {
		padding: 6rem 2rem;
		background: linear-gradient(180deg, #0a0f1c 0%, #1e293b 100%);
		position: relative;
	}

	.operations-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 200px;
		opacity: 0.1;
		z-index: 1;
	}

	.operations-content {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
	}

	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-title {
		font-size: 3rem;
		font-weight: 700;
		color: #f8fafc;
		margin: 0 0 1rem;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.section-subtitle {
		font-size: 1.2rem;
		color: #94a3b8;
		margin: 0;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		margin-bottom: 4rem;
	}

	.metric-card {
		padding: 2rem;
		border-radius: 1.5rem;
		background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.2);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		backdrop-filter: blur(10px);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.metric-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #60a5fa, #34d399);
	}

	.metric-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 35px 70px -12px rgba(0, 0, 0, 0.35);
	}

	.metric-value {
		font-size: 2.5rem;
		font-weight: 800;
		color: #60a5fa;
		margin: 0 0 0.5rem;
		text-shadow: 0 2px 10px rgba(96, 165, 250, 0.3);
	}

	.metric-label {
		font-size: 1.1rem;
		color: #e2e8f0;
		margin: 0 0 0.5rem;
		font-weight: 500;
	}

	.metric-change {
		font-size: 0.9rem;
		color: #34d399;
		font-weight: 600;
	}

	/* Technology Layers */
	.tech-section {
		padding: 6rem 2rem;
		background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
		position: relative;
	}

	.tech-section::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 50%;
		height: 100%;
		opacity: 0.08;
		z-index: 1;
	}

	.tech-content {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
	}

	.tech-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2.5rem;
	}

	.tech-card {
		padding: 2.5rem;
		border-radius: 2rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.15);
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.tech-card::after {
		content: '';
		position: absolute;
		width: 150px;
		height: 150px;
		right: -50px;
		bottom: -50px;
		background: radial-gradient(circle at center, rgba(96, 165, 250, 0.15), transparent);
		transition: all 0.4s ease;
	}

	.tech-card:hover::after {
		transform: scale(1.5);
		opacity: 0.8;
	}

	.tech-card:hover {
		transform: translateY(-8px) scale(1.02);
		border-color: rgba(96, 165, 250, 0.4);
		box-shadow: 0 40px 80px -20px rgba(96, 165, 250, 0.2);
	}

	.tech-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		color: white;
		border-radius: 2rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 1.5rem;
	}

	/* Live Incidents Dashboard */
	.incidents-section {
		padding: 6rem 2rem;
		background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
		position: relative;
	}

	.incidents-section::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 300px;
		background: url('/images/tuasport.jpg') center/cover no-repeat;
		opacity: 0.1;
		z-index: 1;
	}

	.incidents-content {
		position: relative;
		z-index: 2;
		max-width: 1400px;
		margin: 0 auto;
	}

	.dashboard-grid {
		display: grid;
		grid-template-columns: 400px 1fr;
		gap: 3rem;
		margin-top: 3rem;
	}

	.incident-sidebar {
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7));
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 2rem;
		padding: 2rem;
		backdrop-filter: blur(10px);
		position: sticky;
		top: 2rem;
		height: fit-content;
		max-height: 80vh;
		overflow-y: auto;
	}

	.incident-list-items {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.incident-item {
		width: 100%;
		text-align: left;
		padding: 1.5rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1.5rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4));
		color: inherit;
		cursor: pointer;
		transition: all 0.3s ease;
		font: inherit;
	}

	.incident-item:hover {
		transform: translateY(-3px);
		border-color: rgba(96, 165, 250, 0.6);
		box-shadow: 0 20px 40px -15px rgba(96, 165, 250, 0.2);
	}

	.incident-item.selected {
		border-color: rgba(96, 165, 250, 0.8);
		background: linear-gradient(145deg, rgba(37, 99, 235, 0.2), rgba(59, 130, 246, 0.1));
		box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.3);
	}

	.incident-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.incident-id {
		font-size: 0.85rem;
		color: #94a3b8;
		font-family: 'JetBrains Mono', monospace;
	}

	.severity-badge {
		padding: 0.3rem 0.8rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.severity-badge.critical {
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		color: white;
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
	}

	.severity-badge.high {
		background: linear-gradient(135deg, #ea580c, #c2410c);
		color: white;
		box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
	}

	.severity-badge.medium {
		background: linear-gradient(135deg, #ca8a04, #a16207);
		color: white;
		box-shadow: 0 4px 15px rgba(202, 138, 4, 0.3);
	}

	.severity-badge.low {
		background: linear-gradient(135deg, #16a34a, #15803d);
		color: white;
		box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
	}

	.incident-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #f8fafc;
		margin: 0 0 0.5rem;
	}

	.incident-summary {
		font-size: 0.9rem;
		color: #cbd5e1;
		margin: 0;
		line-height: 1.4;
	}

	.incident-detail-panel {
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7));
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 2rem;
		padding: 2.5rem;
		backdrop-filter: blur(10px);
	}

	.detail-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding-bottom: 2rem;
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
	}

	.detail-title {
		font-size: 2rem;
		font-weight: 700;
		color: #f8fafc;
		margin: 0 0 0.5rem;
	}

	.detail-description {
		color: #cbd5e1;
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.6;
	}

	.detail-meta {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		font-size: 0.9rem;
		color: #94a3b8;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #34d399;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.detail-sections {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.detail-section {
		padding: 2rem;
		border-radius: 1.5rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4));
		border: 1px solid rgba(148, 163, 184, 0.15);
	}

	.section-title-small {
		font-size: 1rem;
		font-weight: 600;
		color: #60a5fa;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin: 0 0 1.5rem;
	}

	/* Responsive Design */
	@media (max-width: 1200px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.incident-sidebar {
			position: static;
			max-height: 400px;
		}
	}

	@media (max-width: 768px) {
		.hero-content h1 {
			font-size: 2.5rem;
		}

		.hero-tagline {
			font-size: 1.2rem;
		}

		.hero-meta {
			flex-direction: column;
			gap: 1rem;
		}

		.section-title {
			font-size: 2rem;
		}

		.metrics-grid,
		.tech-grid {
			grid-template-columns: 1fr;
		}

		.tech-card,
		.metric-card {
			padding: 1.5rem;
		}

		.detail-sections {
			grid-template-columns: 1fr;
		}

		.panel-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.panel-header h3 {
			font-size: 1.1rem;
		}

		.status-indicator.online {
			align-self: flex-end;
		}

		.overview-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Scrollbar Styling */
	.incident-sidebar::-webkit-scrollbar {
		width: 6px;
	}

	.incident-sidebar::-webkit-scrollbar-track {
		background: rgba(148, 163, 184, 0.1);
		border-radius: 3px;
	}

	.incident-sidebar::-webkit-scrollbar-thumb {
		background: rgba(96, 165, 250, 0.5);
		border-radius: 3px;
	}

	.incident-sidebar::-webkit-scrollbar-thumb:hover {
		background: rgba(96, 165, 250, 0.7);
	}

	/* Additional Styles for New Elements */
	.view-all-btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		color: white;
		text-decoration: none;
		border-radius: 0.75rem;
		font-weight: 600;
		text-align: center;
		margin-top: 1.5rem;
		transition: all 0.3s ease;
	}

	.view-all-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 20px 40px -15px rgba(59, 130, 246, 0.4);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
		gap: 1rem; /* Add gap to prevent overlap */
	}

	.panel-header h3 {
		font-size: 1.2rem;
		font-weight: 600;
		color: #f8fafc;
		margin: 0;
		flex: 1; /* Allow title to take available space */
		min-width: 0; /* Allow title to shrink if needed */
	}

	.incident-count {
		background: rgba(59, 130, 246, 0.2);
		color: #bfdbfe;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.ai-status.online {
		background: rgba(34, 197, 94, 0.2);
		color: #86efac;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.status-indicator.online {
		background: rgba(34, 197, 94, 0.2);
		color: #86efac;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.85rem;
		font-weight: 500;
		white-space: nowrap; /* Prevent text wrapping */
		flex-shrink: 0; /* Prevent shrinking */
	}

	.operations-overview {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.overview-stat {
		text-align: center;
		padding: 1rem;
		background: rgba(30, 41, 59, 0.6);
		border-radius: 1rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
	}

	.overview-stat h4 {
		font-size: 0.9rem;
		color: #94a3b8;
		margin: 0 0 0.5rem;
		font-weight: 500;
	}

	.overview-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #60a5fa;
		display: block;
		margin-bottom: 0.25rem;
	}

	.overview-trend {
		font-size: 0.8rem;
		color: #34d399;
		font-weight: 500;
	}

	.next-actions h4 {
		color: #f8fafc;
		margin: 0 0 1rem;
		font-size: 1rem;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	.quick-action {
		padding: 0.75rem 1rem;
		background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.3);
		color: #cbd5e1;
		border-radius: 0.75rem;
		text-decoration: none;
		transition: all 0.3s ease;
		font-weight: 500;
		text-align: center;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.quick-action:hover {
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 10px 25px -10px rgba(59, 130, 246, 0.4);
	}

	.ai-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.gpt-interface {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.ai-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.quick-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.3);
		color: #cbd5e1;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.action-btn:hover {
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		color: white;
		transform: translateY(-2px);
		box-shadow: 0 10px 25px -10px rgba(59, 130, 246, 0.4);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.scroll-indicator {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
	}

	.scroll-arrow {
		width: 24px;
		height: 24px;
		border-right: 2px solid #60a5fa;
		border-bottom: 2px solid #60a5fa;
		transform: rotate(45deg);
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%,
		20%,
		50%,
		80%,
		100% {
			transform: translateX(-50%) rotate(45deg) translateY(0);
		}
		40% {
			transform: translateX(-50%) rotate(45deg) translateY(-10px);
		}
		60% {
			transform: translateX(-50%) rotate(45deg) translateY(-5px);
		}
	}

	.hero-stats {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 3rem;
		flex-wrap: wrap;
	}

	.stat {
		text-align: center;
		padding: 1rem 2rem;
		background: rgba(30, 41, 59, 0.4);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1rem;
		backdrop-filter: blur(10px);
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: #60a5fa;
		display: block;
	}

	.stat-label {
		font-size: 0.9rem;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.tagline {
		font-size: 1.5rem;
		color: #cbd5e1;
		margin: 0 0 2rem;
		font-weight: 300;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}
</style>

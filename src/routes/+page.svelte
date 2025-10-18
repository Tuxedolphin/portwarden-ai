<script>
	import { incidents } from '$lib/data/incidents';
	import { impactHighlights, layers } from '$lib/data/architecture';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';

	/** @type {{ title?: string, message?: string, code?: string, steps?: string[], detailsPages?: string[] } | null} */
	let errorObj = null;
	let scrollY = 0;

	let teusProcessed = 0;
	let responseTime = 0;

	const severityPalette = {
		Critical: 'critical',
		High: 'high',
		Medium: 'medium',
		Low: 'low'
	};

	/** @param {string | undefined} key */
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
			const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
			const current = startValue + (target - startValue) * easeOutExpo;

			callback(current);

			if (progress < 1) {
				requestAnimationFrame(update);
			} else {
				callback(target);
			}
		}

		requestAnimationFrame(update);
	}

	onMount(() => {
		animateCounter(10, 1800, (value) => {
			teusProcessed = value;
		});

		animateCounter(2, 2000, (value) => {
			responseTime = value;
		});
	});
</script>

<svelte:window bind:scrollY />

<svelte:head>
	<meta
		name="description"
		content="Portwarden AI delivers real-time maritime visibility, AI copilots and resilient port operations for every terminal."
	/>
</svelte:head>

<Header />

<section class="hero" style="--scroll-y: {scrollY}px">
	<div class="hero__background"></div>
	<div class="hero__overlay"></div>
	<div class="container hero__content">
		<div class="hero__copy">
			<span class="badge hero__badge">Port operations OS</span>
			<h1>Command the future of maritime logistics</h1>
			<p>
				Orchestrate terminals, tugs and trade flows from a single digital bridge. Portwarden AI
				fuses telemetry, incident intelligence and copilots so every berth operates with certainty.
			</p>
			<div class="hero__actions">
				<a class="button-primary" href="/incidents">Launch incidents console</a>
				<a class="button-secondary" href="/demo">View product tour</a>
			</div>
			<div class="hero__metrics">
				<div class="hero__metric surface-muted">
					<span class="metric__label">TEU processed</span>
					<span class="metric__value">
						{#if teusProcessed < 1}
							0M+
						{:else}
							{Math.floor(teusProcessed)}M+
						{/if}
					</span>
					<span class="metric__hint">Automated logistics insights</span>
				</div>
				<div class="hero__metric surface-muted">
					<span class="metric__label">Response window</span>
					<span class="metric__value">
						{#if responseTime < 0.1}
							&lt;1 min
						{:else if responseTime < 2}
							&lt;{Math.max(Math.floor(responseTime), 1)} min
						{:else}
							&lt;{Math.floor(responseTime)} min
						{/if}
					</span>
					<span class="metric__hint">From alert to action</span>
				</div>
				<div class="hero__metric surface-muted">
					<span class="metric__label">Global uptime</span>
					<span class="metric__value">99.4%</span>
					<span class="metric__hint">Secure edge deployments</span>
				</div>
			</div>
			<div class="hero__confidence">
				Trusted by maritime authorities across APAC • SOC2 guardrails • End-to-end encrypted
				telemetry
			</div>
		</div>
		<div class="hero__panel surface-card">
			<div class="hero__panel-head">
				<span class="badge">Live situational view</span>
				<p>
					Portwarden correlates vessel feeds, yard sensors and incident briefings to surface what
					matters.
				</p>
			</div>
			<ul class="hero__panel-list">
				<li>
					<span class="hero__panel-dot"></span>
					AI explains abnormal berth dwell time with actionable mitigations.
				</li>
				<li>
					<span class="hero__panel-dot"></span>
					Predictive queueing prioritises critical cargo and diversions before disruption spreads.
				</li>
				<li>
					<span class="hero__panel-dot"></span>
					Ops copilots generate escalation memos tailored for harbour masters and customs teams.
				</li>
			</ul>
			<div class="hero__panel-footer">
				<span class="status-pill">
					<span class="status-pill__dot"></span>
					All terminals green
				</span>
				<span class="status-pill status-pill--quiet">AI copilots online</span>
			</div>
		</div>
	</div>
	<div class="hero__scroll" aria-hidden="true">
		<span></span>
	</div>
</section>

<section class="section section--operations">
	<div class="container">
		<header class="section__header">
			<span class="badge">Operations intelligence</span>
			<h2>Every terminal, one unified timeline</h2>
			<p>
				Blend radar, AIS and terminal systems with AI spotlighting risk—Portwarden puts everyone on
				the same page in seconds.
			</p>
		</header>
		<div class="operations__grid">
			{#each impactHighlights as highlight}
				<article class="operations__card surface-card">
					<h3>{highlight.value}</h3>
					<p>{highlight.label}</p>
					<span>{highlight.subtext}</span>
				</article>
			{/each}
		</div>
	</div>
</section>

<section class="section section--architecture">
	<div class="container">
		<header class="section__header section__header--left">
			<span class="badge">Architecture</span>
			<h2>Layered AI that respects maritime workflows</h2>
			<p>A modular stack built for port resilience—from sensor edges to governance dashboards.</p>
		</header>
		<div class="architecture__grid">
			{#each layers as layer, index}
				<article class="architecture__card surface-card">
					<div class="architecture__badge">Layer 0{index + 1}</div>
					<div class="architecture__body">
						<h3>{layer.title}</h3>
						<p>{layer.description}</p>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>

<section class="section section--incidents">
	<div class="container incidents__layout">
		<div class="incidents__summary surface-card">
			<header class="incidents__summary-head">
				<div>
					<span class="badge">Live incidents</span>
					<h3>Operational picture</h3>
				</div>
				<a href="/incidents" class="link-view">View console →</a>
			</header>
			<ul class="incidents__list">
				{#each incidents.slice(0, 5) as incident}
					<li class="incidents__item surface-muted">
						<div class="incidents__item-head">
							<span class="incidents__id">{incident.displayId}</span>
							<span class={`badge ${safeSeverity(incident.severity)}`}>{incident.severity}</span>
						</div>
						<h4>{incident.title}</h4>
						<p>{incident.summary}</p>
						<div class="incidents__meta">
							<span>{formatTimestamp(incident.occurredAt) || 'Just now'}</span>
							<span>{incident.channel || 'Port Authority Dispatch'}</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<div class="incidents__board surface-card">
			<header class="incidents__board-head">
				<h3>Port command briefing</h3>
				<span class="status-pill">
					<span class="status-pill__dot"></span>
					AI copilots assisting
				</span>
			</header>
			<div class="incidents__board-grid">
				<div class="board-stat">
					<span class="board-stat__label">Active vessels</span>
					<span class="board-stat__value">47</span>
					<span class="board-stat__hint">3 arrival adjustments today</span>
				</div>
				<div class="board-stat">
					<span class="board-stat__label">Cargo throughput</span>
					<span class="board-stat__value">12.4K</span>
					<span class="board-stat__hint">TEU processed in last 24h</span>
				</div>
				<div class="board-stat">
					<span class="board-stat__label">System health</span>
					<span class="board-stat__value">98.7%</span>
					<span class="board-stat__hint">Redundant nodes online</span>
				</div>
				<div class="board-stat">
					<span class="board-stat__label">Incident cadence</span>
					<span class="board-stat__value">11</span>
					<span class="board-stat__hint">Resolved in last week</span>
				</div>
			</div>
			<div class="incidents__actions">
				<a href="/incidents" class="button-primary">Manage incidents</a>
				<a href="/archive" class="button-secondary">Review archive</a>
				<button type="button" class="button-secondary button-secondary--ghost"
					>Generate AI report</button
				>
			</div>
		</div>
	</div>
</section>

{#if errorObj}
	<section class="section section--error">
		<div class="container">
			<ErrorViewer {errorObj} onRetry={() => (errorObj = null)} />
		</div>
	</section>
{/if}

<style>
	.hero {
		position: relative;
		min-height: calc(100vh - 68px);
		display: flex;
		align-items: center;
		padding: clamp(4rem, 9vw, 8rem) 0 clamp(3rem, 8vw, 6rem);
		overflow: hidden;
	}

	.hero__background,
	.hero__overlay {
		position: absolute;
		inset: 0;
	}

	.hero__background {
		background: url('/images/wideangle.jpg') center/cover no-repeat;
		transform: translateY(calc(var(--scroll-y, 0px) * 0.4));
		will-change: transform;
		opacity: 0.45;
	}

	.hero__overlay {
		background: linear-gradient(
			180deg,
			rgba(5, 11, 24, 0.85) 0%,
			rgba(5, 11, 24, 0.92) 45%,
			rgba(8, 15, 35, 0.98) 100%
		);
	}

	.hero__content {
		position: relative;
		z-index: 2;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: clamp(2rem, 6vw, 4rem);
		align-items: start;
	}

	.hero__copy {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.hero__copy h1 {
		margin: 0;
		font-size: clamp(2.75rem, 4vw, 3.8rem);
		letter-spacing: -0.02em;
		background: linear-gradient(135deg, #60a5fa 0%, #7dd3fc 40%, #c4b5fd 90%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.hero__copy p {
		margin: 0;
		color: var(--pw-text-secondary);
		max-width: 56ch;
		font-size: 1.05rem;
	}

	.hero__badge {
		align-self: flex-start;
	}

	.hero__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.hero__metrics {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.hero__metric {
		position: relative;
		padding: 1.1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.metric__label {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: var(--pw-text-muted);
	}

	.metric__value {
		font-size: 1.9rem;
		font-weight: 700;
		color: var(--pw-text-primary);
	}

	.metric__hint {
		font-size: 0.85rem;
		color: var(--pw-text-muted);
	}

	.hero__confidence {
		font-size: 0.85rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--pw-text-muted);
	}

	.hero__panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.hero__panel p {
		margin: 0;
		color: var(--pw-text-secondary);
	}

	.hero__panel-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 1rem;
	}

	.hero__panel-list li {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		color: var(--pw-text-secondary);
		line-height: 1.5;
	}

	.hero__panel-dot {
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: linear-gradient(135deg, #38bdf8, #7c3aed);
		box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.16);
		margin-top: 0.35rem;
	}

	.hero__panel-footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.9rem;
		border-radius: 999px;
		border: 1px solid rgba(148, 163, 184, 0.38);
		background: rgba(15, 23, 42, 0.55);
		color: #e2e8f0;
		font-size: 0.8rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.status-pill--quiet {
		background: transparent;
		border-color: rgba(148, 163, 184, 0.2);
		color: var(--pw-text-muted);
	}

	.status-pill__dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--pw-success);
		box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.15);
	}

	.hero__scroll {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		width: 24px;
		height: 44px;
		border-radius: 999px;
		border: 1px solid rgba(148, 163, 184, 0.3);
		display: flex;
		justify-content: center;
		padding: 0.35rem 0;
		opacity: 0.65;
	}

	.hero__scroll span {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(148, 163, 184, 0.6);
		animation: scroll 2.2s infinite;
	}

	@keyframes scroll {
		0% {
			transform: translateY(2px);
			opacity: 0;
		}
		40% {
			transform: translateY(10px);
			opacity: 1;
		}
		100% {
			transform: translateY(20px);
			opacity: 0;
		}
	}

	.section {
		padding: clamp(4rem, 9vw, 6rem) 0 clamp(4rem, 10vw, 7rem);
		position: relative;
	}

	.section__header {
		text-align: center;
		display: grid;
		gap: 1rem;
		justify-items: center;
		margin-bottom: clamp(2.5rem, 6vw, 4rem);
	}

	.section__header h2 {
		margin: 0;
		font-size: clamp(2rem, 3.2vw, 2.8rem);
	}

	.section__header p {
		margin: 0;
		max-width: 60ch;
		color: var(--pw-text-secondary);
		font-size: 1.05rem;
	}

	.section__header--left {
		justify-items: flex-start;
		text-align: left;
	}

	.section--operations::before,
	.section--architecture::before,
	.section--incidents::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		opacity: 0.35;
	}

	.section--operations::before {
		background: radial-gradient(circle at 20% 10%, rgba(37, 99, 235, 0.25), transparent 55%);
	}

	.section--architecture::before {
		background: radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.22), transparent 60%);
	}

	.section--incidents::before {
		background: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.18), transparent 60%);
	}

	.operations__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.75rem;
	}

	.operations__card {
		min-height: 185px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.operations__card h3 {
		margin: 0;
		font-size: 2rem;
		color: var(--pw-accent);
	}

	.operations__card p {
		margin: 0;
		color: var(--pw-text-primary);
		font-weight: 600;
	}

	.operations__card span {
		font-size: 0.9rem;
		color: var(--pw-text-muted);
	}

	.architecture__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.75rem;
	}

	.architecture__card {
		position: relative;
		padding: 1.75rem;
		display: grid;
		gap: 1.25rem;
	}

	.architecture__badge {
		align-self: flex-start;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		background: rgba(59, 130, 246, 0.16);
		border: 1px solid rgba(59, 130, 246, 0.35);
		color: #dbeafe;
		border-radius: 999px;
		padding: 0.25rem 0.75rem;
	}

	.architecture__body h3 {
		margin: 0 0 0.6rem;
	}

	.architecture__body p {
		margin: 0;
		color: var(--pw-text-secondary);
	}

	.incidents__layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: clamp(2rem, 4vw, 3rem);
		align-items: stretch;
	}

	.incidents__summary,
	.incidents__board {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.incidents__summary-head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
	}

	.incidents__summary-head h3 {
		margin: 0.3rem 0 0;
		font-size: 1.4rem;
	}

	.link-view {
		color: #bfdbfe;
		font-size: 0.85rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.incidents__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1rem;
	}

	.incidents__item {
		padding: 1.25rem 1.4rem;
		display: grid;
		gap: 0.75rem;
	}

	.incidents__item-head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: center;
	}

	.incidents__id {
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		color: var(--pw-text-muted);
		text-transform: uppercase;
	}

	.incidents__item h4 {
		margin: 0;
		font-size: 1.05rem;
	}

	.incidents__item p {
		margin: 0;
		color: var(--pw-text-secondary);
	}

	.incidents__meta {
		display: flex;
		gap: 1.2rem;
		flex-wrap: wrap;
		font-size: 0.8rem;
		color: var(--pw-text-muted);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.incidents__board-head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: center;
	}

	.incidents__board-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.25rem;
	}

	.board-stat {
		padding: 1.25rem 1.4rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1rem;
		background: rgba(15, 23, 42, 0.45);
		display: grid;
		gap: 0.45rem;
	}

	.board-stat__label {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--pw-text-muted);
	}

	.board-stat__value {
		font-size: 1.6rem;
		font-weight: 700;
	}

	.board-stat__hint {
		font-size: 0.85rem;
		color: var(--pw-text-secondary);
	}

	.incidents__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.button-secondary--ghost {
		background: transparent;
		border-color: rgba(148, 163, 184, 0.35);
	}

	.section--error {
		padding-top: 0;
	}

	@media (max-width: 920px) {
		.hero {
			padding-top: clamp(3.5rem, 12vw, 6rem);
		}

		.hero__scroll {
			display: none;
		}

		.hero__actions {
			width: 100%;
		}

		.hero__panel {
			order: -1;
		}
	}

	@media (max-width: 640px) {
		.hero__copy h1 {
			font-size: clamp(2.45rem, 9vw, 2.9rem);
		}

		.hero__metrics {
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		}

		.incidents__board-grid {
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		}
	}

	.incident-sidebar {
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

	.chatgpt-interface {
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

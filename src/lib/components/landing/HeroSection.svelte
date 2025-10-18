<script>
	import { onMount } from 'svelte';

	let teusProcessed = 0;
	let responseTime = 0;
	let scrollY = 0;

	/**
	 * @param {number} target
	 * @param {number} duration
	 * @param {(value: number) => void} callback
	 */
	function animateCounter(target, duration, callback) {
		const start = performance.now();
		const startValue = 0;

		/**
		 * @param {number} timestamp
		 */
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

<section class="hero" style={`--scroll-y: ${scrollY}px`}>
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

<style src="./HeroSection.css"></style>

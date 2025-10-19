<script>
	let { value, label, change } = $props();
</script>

<div class="metric-card">
	<h3 class="metric-value">{value}</h3>
	<p class="metric-label">{label}</p>
	<span class="metric-change">{change}</span>
</div>

<style>
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
		color: var(--maritime-accent, #60a5fa);
		margin: 0 0 0.5rem;
		text-shadow: 0 2px 10px rgba(96, 165, 250, 0.3);
	}

	.metric-label {
		font-size: 1.1rem;
		color: var(--maritime-text-secondary, #e2e8f0);
		margin: 0 0 0.5rem;
		font-weight: 500;
	}

	.metric-change {
		font-size: 0.9rem;
		color: var(--maritime-status-low, #34d399);
		font-weight: 600;
	}
</style>
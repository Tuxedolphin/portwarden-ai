<script>
	let { value, label } = $props();
</script>

<div class="stat-item">
	<span class="stat-value">{value}</span>
	<span class="stat-label">{label}</span>
</div>

<style>
	.stat-item {
		text-align: center;
		padding: 1.5rem;
		background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1rem;
		backdrop-filter: blur(10px);
		transition: background 0.3s ease, border-color 0.3s ease;
	}
	
	:global(html.light) .stat-item {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.3);
	}

	.stat-value {
		display: block;
		font-size: 2rem;
		font-weight: 800;
		color: var(--maritime-accent, #60a5fa);
		text-shadow: 0 2px 10px rgba(96, 165, 250, 0.3);
		transition: color 0.3s ease;
	}

	.stat-label {
		display: block;
		font-size: 0.9rem;
		color: var(--maritime-text-muted, #94a3b8);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-top: 0.5rem;
		transition: color 0.3s ease;
	}
</style>
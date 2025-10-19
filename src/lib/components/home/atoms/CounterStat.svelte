<script>
	let { value, label, format = 'default' } = $props();
	
	/** @param {number} val */
	function formatValue(val) {
		if (format === 'teu') {
			if (val < 1) return '0M';
			if (val < 10) return `${Math.floor(val)}M`;
			return `${Math.floor(val)}M+`;
		}
		if (format === 'time') {
			if (val < 0.1) return '<1min';
			if (val < 2) return `<${Math.floor(val) || 1}min`;
			return `<${Math.floor(val)}min`;
		}
		return val;
	}
</script>

<div class="stat">
	<span class="stat-number">{formatValue(value)}</span>
	<span class="stat-label">{label}</span>
</div>

<style>
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
		color: var(--maritime-accent, #60a5fa);
		display: block;
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--maritime-text-muted, #94a3b8);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
</style>
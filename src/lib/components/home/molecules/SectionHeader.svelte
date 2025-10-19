<script>
	let { title, subtitle } = $props();
</script>

<div class="section-header">
	<h2 class="section-title">{title}</h2>
	<p class="section-subtitle">{subtitle}</p>
</div>

<style>
	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-title {
		font-size: 3rem;
		font-weight: 700;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 1rem;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.section-subtitle {
		font-size: 1.2rem;
		color: var(--maritime-text-muted, #94a3b8);
		margin: 0;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.section-title {
			font-size: 2rem;
		}
	}
</style>
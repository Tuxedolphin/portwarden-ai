<script>
	import SectionHeader from '../molecules/SectionHeader.svelte';
	import MetricCard from '../atoms/MetricCard.svelte';
	
	let { impactHighlights } = $props();
</script>

<section class="operations-section">
	<div class="operations-content">
		<SectionHeader 
			title="Operations Intelligence"
			subtitle="Real-time monitoring and AI-powered insights for maritime operations"
		/>

		<div class="metrics-grid">
			{#each impactHighlights as highlight}
				<MetricCard 
					value={highlight.value}
					label={highlight.label}
					change={highlight.subtext}
				/>
			{/each}
		</div>
	</div>
</section>

<style>
	.operations-section {
		padding: 6rem 2rem;
		background: linear-gradient(180deg, var(--maritime-bg-primary, #0a0f1c) 0%, var(--maritime-bg-secondary, #1e293b) 100%);
		position: relative;
		transition: background 0.3s ease;
	}
	
	/* Force light theme background */
	:global(html.light) .operations-section {
		background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
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

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		margin-bottom: 4rem;
	}

	@media (max-width: 768px) {
		.metrics-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
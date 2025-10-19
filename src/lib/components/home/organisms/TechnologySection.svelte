<script>
	import SectionHeader from '../molecules/SectionHeader.svelte';
	import TechCard from '../atoms/TechCard.svelte';
	
	let { layers } = $props();
</script>

<section class="tech-section">
	<div class="tech-content">
		<SectionHeader 
			title="AI-Powered Maritime Technology"
			subtitle="Three-layer architecture for comprehensive port management"
		/>

		<div class="tech-grid">
			{#each layers as layer, index}
				<TechCard 
					title={layer.title}
					description={layer.description}
					{index}
				/>
			{/each}
		</div>
	</div>
</section>

<style>
	.tech-section {
		padding: 6rem 2rem;
		background: linear-gradient(180deg, var(--maritime-bg-secondary, #1e293b) 0%, var(--maritime-bg-primary, #0f172a) 100%);
		position: relative;
		transition: background 0.3s ease;
	}
	
	/* Force light theme background */
	:global(html.light) .tech-section {
		background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%) !important;
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

	@media (max-width: 768px) {
		.tech-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
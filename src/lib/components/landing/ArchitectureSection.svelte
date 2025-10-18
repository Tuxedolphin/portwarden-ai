<script>
	/**
	 * @typedef {{ id: string; title: string; kicker: string; description: string }} Layer
	 */

	/** @type {Layer[]} */
	export let layers = [];
</script>

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

<style src="./ArchitectureSection.css"></style>

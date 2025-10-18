<script>
	/**
	 * @typedef {{ label: string; value: string; subtext: string }} Highlight
	 */

	/** @type {Highlight[]} */
	export let highlights = [];
</script>

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
			{#each highlights as highlight}
				<article class="operations__card surface-card">
					<h3>{highlight.value}</h3>
					<p>{highlight.label}</p>
					<span>{highlight.subtext}</span>
				</article>
			{/each}
		</div>
	</div>
</section>

<style src="./OperationsSection.css"></style>

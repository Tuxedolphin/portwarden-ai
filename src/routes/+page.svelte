<script>
	import Header from '$lib/components/Header.svelte';
	import HeroSection from '$lib/components/landing/HeroSection.svelte';
	import OperationsSection from '$lib/components/landing/OperationsSection.svelte';
	import ArchitectureSection from '$lib/components/landing/ArchitectureSection.svelte';
	import IncidentsPreview from '$lib/components/landing/IncidentsPreview.svelte';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	import { incidents } from '$lib/data/incidents';
	import { impactHighlights, layers } from '$lib/data/architecture';

	/** @type {{ title?: string, message?: string, code?: string, steps?: string[], detailsPages?: string[] } | null} */
	let errorObj = null;
</script>

<svelte:head>
	<meta
		name="description"
		content="Portwarden AI delivers real-time maritime visibility, AI copilots and resilient port operations for every terminal."
	/>
</svelte:head>

<Header />

<main class="landing">
	<HeroSection />
	<OperationsSection highlights={impactHighlights} />
	<ArchitectureSection {layers} />
	<IncidentsPreview {incidents} />

	{#if errorObj}
		<section class="section section--error">
			<div class="container">
				<ErrorViewer {errorObj} onRetry={() => (errorObj = null)} />
			</div>
		</section>
	{/if}
</main>

<style src="$lib/styles/landing/index.css"></style>

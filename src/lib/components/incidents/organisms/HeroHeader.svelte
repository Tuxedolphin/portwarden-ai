<script>
	import { Button } from '$lib/components/ui';
	import StatsBar from '../molecules/StatsBar.svelte';
	
	let { 
		title = "Incident Management",
		subtitle = "Monitor and resolve port operations incidents in real-time",
		items = [],
		onNewIncident 
	} = $props();
</script>

<section class="hero-header">
	<div class="hero-content">
		<div class="hero-text">
			<h1>{title}</h1>
			<p class="hero-subtitle">{subtitle}</p>
		</div>
		<Button class="new-incident-btn" onclick={onNewIncident}>
			<span class="btn-icon">+</span>
			New Incident
		</Button>
	</div>

	<StatsBar {items} />
</section>

<style>
	/* Hero Header Section */
	.hero-header {
		position: relative;
		background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
		padding: 3rem 2rem 2rem;
		margin-bottom: 3rem;
		overflow: hidden;
		transition: background 0.3s ease, border-color 0.3s ease;
	}
	
	:global(html.light) .hero-header {
		background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.9) 100%);
		border-bottom: 1px solid rgba(148, 163, 184, 0.3);
	}

	.hero-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('/images/wideangle.jpg') center/cover no-repeat;
		opacity: 0.1;
		z-index: 1;
	}

	.hero-content {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;
	}

	.hero-text h1 {
		font-size: 3rem;
		font-weight: 800;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 0.5rem;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		transition: color 0.3s ease;
	}
	
	:global(html.light) .hero-text h1 {
		color: #0f172a !important;
		text-shadow: 0 2px 10px rgba(255, 255, 255, 0.8);
	}

	.hero-subtitle {
		font-size: 1.2rem;
		color: var(--maritime-text-muted, #94a3b8);
		margin: 0;
		font-weight: 300;
		transition: color 0.3s ease;
	}

	@media (max-width: 768px) {
		.hero-content {
			flex-direction: column;
			gap: 2rem;
			align-items: stretch;
		}

		.hero-text h1 {
			font-size: 2rem;
		}
	}
</style>
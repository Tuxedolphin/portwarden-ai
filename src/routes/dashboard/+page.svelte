<script>
	import { incidents } from '$lib/data/incidents';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	import Header from '$lib/components/Header.svelte';
	import { DashboardIncidents } from '$lib/components/home';

	/** @type {{ title?: string, message?: string, code?: string, steps?: string[], detailsPages?: string[] } | null} */
	let errorObj = null;

	const severityPalette = {
		Critical: 'critical',
		High: 'high',
		Medium: 'medium',
		Low: 'low'
	};

	/** @param {string|undefined} key */
	function safeSeverity(key) {
		if (!key) return 'medium';
		if (key === 'Critical') return severityPalette.Critical;
		if (key === 'High') return severityPalette.High;
		if (key === 'Medium') return severityPalette.Medium;
		if (key === 'Low') return severityPalette.Low;
		return 'medium';
	}

	/** @param {any} value */
	function formatTimestamp(value) {
		if (!value) return 'n/a';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return date.toLocaleString('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short',
			timeZone: 'UTC'
		});
	}
</script>

<!-- Dashboard Header with Navigation -->
<Header />

<!-- Main Dashboard Content -->
<main class="dashboard-main">
	<div class="dashboard-header">
		<h1>Maritime Operations Dashboard</h1>
		<p class="dashboard-subtitle">Real-time monitoring and incident management</p>
	</div>

	<!-- Live Incidents Dashboard -->
	<DashboardIncidents {incidents} {formatTimestamp} {safeSeverity} />
</main>

{#if errorObj}
	<div class="error-section">
		<div class="container">
			<ErrorViewer {errorObj} onRetry={() => (errorObj = null)} />
		</div>
	</div>
{/if}

<style>
	:global(*) {
		box-sizing: border-box;
	}	.dashboard-main {
		padding: 2rem 0 0;
		background: transparent;
	}

	.dashboard-header {
		text-align: center;
		padding: 3rem 2rem 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.dashboard-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 1rem;
		background: linear-gradient(135deg, var(--maritime-accent, #60a5fa), var(--maritime-accent-secondary, #34d399));
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: none;
		transition: all 0.3s ease;
	}
	
	/* Better contrast for light theme */
	:global(html.light) .dashboard-header h1 {
		background: linear-gradient(135deg, #1e40af, #059669);
		-webkit-text-fill-color: transparent;
		background-clip: text;
		-webkit-background-clip: text;
	}

	.dashboard-subtitle {
		font-size: 1.2rem;
		color: var(--maritime-text-muted, #94a3b8);
		margin: 0;
		font-weight: 300;
		transition: color 0.3s ease;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	@media (max-width: 768px) {
		.dashboard-header h1 {
			font-size: 1.8rem;
		}

		.dashboard-subtitle {
			font-size: 1rem;
		}

		.dashboard-header {
			padding: 2rem 1rem 1rem;
		}
	}
</style>
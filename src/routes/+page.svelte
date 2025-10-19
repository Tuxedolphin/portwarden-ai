<script>
	import { incidents } from '$lib/data/incidents';
	import { impactHighlights, layers } from '$lib/data/architecture';
	import Header from '$lib/components/Header.svelte';
	import { 
		HeroSection, 
		OperationsSection, 
		TechnologySection 
	} from '$lib/components/home';

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

<Header />

<HeroSection />

<OperationsSection {impactHighlights} />

<TechnologySection {layers} />

<!-- Call-to-Action Section for Login -->
<section class="cta-section">
	<div class="cta-content">
		<div class="cta-header">
			<h2>Ready to Get Started?</h2>
			<p>Access your personalized maritime operations dashboard</p>
		</div>
		
		<div class="cta-actions">
			<a href="/login" class="cta-button primary">
				Sign In to Dashboard
			</a>
			<a href="/demo" class="cta-button secondary">
				View Demo
			</a>
		</div>

		<div class="preview-section">
			<h3>Live Incidents Preview</h3>
			<div class="preview-grid">
				{#each incidents.slice(0, 3) as incident}
					<div class="preview-incident">
						<div class="preview-header">
							<span class="preview-id">{incident.displayId}</span>
							<span class="severity-badge {safeSeverity(incident.severity)}">{incident.severity}</span>
						</div>
						<h4>{incident.title}</h4>
						<p>{incident.summary}</p>
						<div class="preview-meta">
							<span>🕐 {formatTimestamp(incident.occurredAt) || 'Just now'}</span>
						</div>
					</div>
				{/each}
			</div>
			<p class="preview-note">
				* Sample data for demonstration. Sign in to access real-time incident monitoring.
			</p>
		</div>
	</div>
</section>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	/* Call-to-Action Section */
	.cta-section {
		padding: 6rem 2rem;
		background: linear-gradient(180deg, var(--maritime-bg-secondary, #1e293b) 0%, var(--maritime-bg-tertiary, #0f172a) 100%);
		position: relative;
		transition: background 0.3s ease;
	}
	
	/* Force light theme background */
	:global(html.light) .cta-section {
		background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%) !important;
	}

	.cta-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('/images/tuasport.jpg') center/cover no-repeat;
		opacity: 0.05;
		z-index: 1;
	}

	.cta-content {
		position: relative;
		z-index: 2;
		max-width: 1200px;
		margin: 0 auto;
		text-align: center;
	}

	.cta-header {
		margin-bottom: 3rem;
	}

	.cta-header h2 {
		font-size: 3rem;
		font-weight: 700;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 1rem;
		background: linear-gradient(135deg, var(--maritime-accent, #60a5fa), var(--maritime-accent-secondary, #34d399));
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		transition: all 0.3s ease;
	}
	
	/* Better gradient for light theme with stronger contrast */
	:global(html.light) .cta-header h2 {
		background: linear-gradient(135deg, #1e3a8a, #047857) !important;
		-webkit-text-fill-color: transparent !important;
		background-clip: text !important;
		-webkit-background-clip: text !important;
	}

	.cta-header p {
		font-size: 1.2rem;
		color: var(--maritime-text-muted, #94a3b8);
		margin: 0;
		transition: color 0.3s ease;
	}
	
	/* Force light theme text color */
	:global(html.light) .cta-header p {
		color: #64748b !important;
	}

	.cta-actions {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 4rem;
		flex-wrap: wrap;
	}

	.cta-button {
		padding: 1rem 2.5rem;
		border-radius: 1rem;
		text-decoration: none;
		font-weight: 600;
		font-size: 1.1rem;
		transition: all 0.3s ease;
		display: inline-block;
	}

	.cta-button.primary {
		background: linear-gradient(135deg, var(--maritime-accent, #60a5fa), var(--maritime-accent-secondary, #3b82f6));
		color: white !important; /* Button text should remain white on blue background */
		box-shadow: 0 10px 25px -10px rgba(59, 130, 246, 0.4);
		transition: all 0.3s ease;
	}

	.cta-button.primary:hover {
		transform: translateY(-3px);
		box-shadow: 0 20px 40px -15px rgba(59, 130, 246, 0.6);
	}

	.cta-button.secondary {
		background: transparent;
		border: 2px solid rgba(96, 165, 250, 0.5);
		color: var(--maritime-accent, #60a5fa);
		transition: all 0.3s ease;
	}

	.cta-button.secondary:hover {
		background: rgba(96, 165, 250, 0.1);
		border-color: var(--maritime-accent, #60a5fa);
		transform: translateY(-3px);
	}

	/* Preview Section */
	.preview-section {
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4));
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 2rem;
		padding: 3rem 2rem;
		backdrop-filter: blur(10px);
		transition: background 0.3s ease, border-color 0.3s ease;
	}
	
	/* Force light theme preview section */
	:global(html.light) .preview-section {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6)) !important;
		border: 1px solid rgba(148, 163, 184, 0.3);
	}

	.preview-section h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 2rem;
		text-align: center;
		transition: color 0.3s ease;
	}
	
	/* Force light theme preview title */
	:global(html.light) .preview-section h3 {
		color: #0f172a !important;
	}

	.preview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.preview-incident {
		padding: 1.5rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4));
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1rem;
		text-align: left;
		transition: background 0.3s ease, border-color 0.3s ease;
	}
	
	/* Force light theme preview incident background */
	:global(html.light) .preview-incident {
		background: linear-gradient(145deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.6)) !important;
		border: 1px solid rgba(148, 163, 184, 0.3);
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.preview-id {
		font-size: 0.85rem;
		color: var(--maritime-text-muted, #94a3b8);
		font-family: 'JetBrains Mono', monospace;
		transition: color 0.3s ease;
	}
	
	/* Force light theme preview ID color */
	:global(html.light) .preview-id {
		color: #64748b !important;
	}

	.severity-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.severity-badge.critical {
		background: linear-gradient(135deg, var(--maritime-status-critical, #dc2626), #b91c1c);
		color: white !important; /* White text on red background for all themes */
		transition: color 0.3s ease;
	}

	.severity-badge.high {
		background: linear-gradient(135deg, var(--maritime-status-high, #ea580c), #c2410c);
		color: white !important; /* White text on orange background for all themes */
		transition: color 0.3s ease;
	}

	.severity-badge.medium {
		background: linear-gradient(135deg, var(--maritime-status-medium, #ca8a04), #a16207);
		color: white !important; /* White text on yellow background for all themes */
		transition: color 0.3s ease;
	}

	.severity-badge.low {
		background: linear-gradient(135deg, var(--maritime-status-low, #16a34a), #15803d);
		color: white !important; /* White text on green background for all themes */
		transition: color 0.3s ease;
	}

	.preview-incident h4 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--maritime-text-primary, #f8fafc);
		margin: 0 0 0.5rem;
		transition: color 0.3s ease;
	}
	
	/* Force light theme incident title */
	:global(html.light) .preview-incident h4 {
		color: #0f172a !important;
	}

	.preview-incident p {
		font-size: 0.9rem;
		color: var(--maritime-text-secondary, #cbd5e1);
		margin: 0 0 1rem;
		line-height: 1.4;
		transition: color 0.3s ease;
	}
	
	/* Force light theme incident text */
	:global(html.light) .preview-incident p {
		color: #1e293b !important;
	}

	.preview-meta {
		font-size: 0.85rem;
		color: var(--maritime-text-muted, #94a3b8);
		transition: color 0.3s ease;
	}
	
	/* Force light theme preview meta */
	:global(html.light) .preview-meta {
		color: #475569 !important;
	}

	.preview-note {
		font-size: 0.9rem;
		color: var(--maritime-text-muted, #64748b);
		font-style: italic;
		text-align: center;
		margin: 0;
		transition: color 0.3s ease;
	}
	
	/* Force light theme preview note */
	:global(html.light) .preview-note {
		color: #475569 !important;
	}

	@media (max-width: 768px) {
		.cta-header h2 {
			font-size: 2rem;
		}

		.cta-actions {
			flex-direction: column;
			align-items: center;
		}

		.preview-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
<script>
	let { title, description, index = 0 } = $props();
</script>

<div class="tech-card" style="animation-delay: {index * 0.2}s">
	<div class="tech-badge">Layer 0{index + 1}</div>
	<div class="layer-content">
		<h3>{title}</h3>
		<p>{description}</p>
	</div>
</div>

<style>
	.tech-card {
		padding: 2.5rem;
		border-radius: 2rem;
		background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
		border: 1px solid rgba(148, 163, 184, 0.15);
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.tech-card::after {
		content: '';
		position: absolute;
		width: 150px;
		height: 150px;
		right: -50px;
		bottom: -50px;
		background: radial-gradient(circle at center, rgba(96, 165, 250, 0.15), transparent);
		transition: all 0.4s ease;
	}

	.tech-card:hover::after {
		transform: scale(1.5);
		opacity: 0.8;
	}

	.tech-card:hover {
		transform: translateY(-8px) scale(1.02);
		border-color: rgba(96, 165, 250, 0.4);
		box-shadow: 0 40px 80px -20px rgba(96, 165, 250, 0.2);
	}

	.tech-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		color: white !important; /* Badge text should stay white on blue background */
		border-radius: 2rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 1.5rem;
	}

	.layer-content h3 {
		color: var(--maritime-text-primary, #f8fafc);
		font-size: 1.4rem;
		font-weight: 600;
		margin: 0 0 1rem;
	}

	.layer-content p {
		color: var(--maritime-text-secondary, #cbd5e1);
		line-height: 1.6;
		margin: 0;
	}
</style>
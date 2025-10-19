<script>
	import { onMount } from 'svelte';
	import CounterStat from '../atoms/CounterStat.svelte';

	let scrollY = $state(0);
	let teusProcessed = $state(0);
	let responseTime = $state(0);
	let mounted = $state(false);

	/** @param {number} target @param {number} duration @param {(value: number) => void} callback */
	function animateCounter(target, duration, callback) {
		const start = performance.now();
		const startValue = 0;

		/** @param {number} timestamp */
		function update(timestamp) {
			const elapsed = timestamp - start;
			const progress = Math.min(elapsed / duration, 1);

			// Smoother easing function
			const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
			const current = startValue + (target - startValue) * easeOutExpo;

			callback(current);

			if (progress < 1) {
				requestAnimationFrame(update);
			} else {
				// Ensure we end exactly on the target value
				callback(target);
			}
		}

		requestAnimationFrame(update);
	}

	onMount(() => {
		mounted = true;

		// Start counter animations with less staggered delays for smoother feel
		setTimeout(() => {
			animateCounter(10, 1800, (value) => {
				teusProcessed = value;
			});
		}, 300);

		setTimeout(() => {
			animateCounter(2, 2000, (value) => {
				responseTime = value;
			});
		}, 600);

		// Handle scroll binding
		function handleScroll() {
			scrollY = window.scrollY;
		}
		
		window.addEventListener('scroll', handleScroll);
		
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<!-- Hero Section with Parallax -->
<section class="hero-section" style="--scroll-y: {scrollY}px">
	<div class="hero-content">
		<div class="hero-text">
			<h1>Portwarden AI</h1>
			<p class="tagline">Intelligent oversight for maritime operations.</p>
			<div class="hero-stats">
				<CounterStat value={teusProcessed} label="TEU Processed" format="teu" />
				<CounterStat value={24} label="Monitoring" format="24/7" />
				<CounterStat value={responseTime} label="Response Time" format="time" />
			</div>
		</div>
	</div>
	<div class="scroll-indicator">
		<div class="scroll-arrow"></div>
	</div>
</section>

<style>
	.hero-section {
		position: relative;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			180deg,
			rgba(10, 15, 28, 0.2) 0%,
			rgba(10, 15, 28, 0.7) 50%,
			rgba(10, 15, 28, 0.95) 100%
		);
		transition: var(--maritime-transition);
		z-index: 2;
	}
	
	:global(html.light) .hero-section::before {
		background: linear-gradient(
			180deg,
			rgba(248, 250, 252, 0.2) 0%,
			rgba(248, 250, 252, 0.7) 50%,
			rgba(248, 250, 252, 0.95) 100%
		);
	}

	.hero-section::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: url('/images/wideangle.jpg') center/cover no-repeat;
		transform: translateY(calc(var(--scroll-y, 0px) * 0.5));
		will-change: transform;
		z-index: 1;
	}

	.hero-content {
		position: relative;
		z-index: 3;
		text-align: center;
		max-width: 900px;
		padding: 2rem;
	}

	.hero-content h1 {
		font-size: 4rem;
		font-weight: 800;
		margin: 0 0 1rem;
		background: linear-gradient(135deg, var(--maritime-accent, #60a5fa), var(--maritime-accent-secondary, #34d399), #fbbf24);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		text-shadow: none;
		letter-spacing: -0.02em;
		transition: all 0.3s ease;
	}
	
	/* Better contrast for light theme */
	:global(html.light) .hero-content h1 {
		background: linear-gradient(135deg, #1e40af, #059669, #d97706);
		-webkit-text-fill-color: transparent;
		background-clip: text;
		-webkit-background-clip: text;
	}

	.tagline {
		font-size: 1.5rem;
		color: var(--maritime-text-secondary, #cbd5e1);
		margin: 0 0 2rem;
		font-weight: 300;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
		transition: color 0.3s ease;
	}
	
	/* Better tagline visibility in light mode */
	:global(html.light) .tagline {
		color: #1e293b !important;
		text-shadow: 0 2px 10px rgba(255, 255, 255, 0.8);
	}

	.hero-stats {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 3rem;
		flex-wrap: wrap;
	}

	.scroll-indicator {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 3;
	}

	.scroll-arrow {
		width: 24px;
		height: 24px;
		border-right: 2px solid #60a5fa;
		border-bottom: 2px solid #60a5fa;
		transform: rotate(45deg);
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% {
			transform: translateX(-50%) rotate(45deg) translateY(0);
		}
		40% {
			transform: translateX(-50%) rotate(45deg) translateY(-10px);
		}
		60% {
			transform: translateX(-50%) rotate(45deg) translateY(-5px);
		}
	}

	@media (max-width: 768px) {
		.hero-content h1 {
			font-size: 2.5rem;
		}

		.tagline {
			font-size: 1.2rem;
		}

		.hero-stats {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
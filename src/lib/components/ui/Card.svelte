<script>
	import { cn } from "$lib/utils/utils.js";

	let {
		class: className = "",
		children,
		...restProps
	} = $props();
</script>

<div class={cn('pw-card', className)} {...restProps}>
	{@render children?.()}
</div>

<style>
	.pw-card {
		position: relative;
		display: flex;
		flex-direction: column;
		border-radius: 1.5rem;
		border: 1px solid var(--maritime-border, rgba(148, 163, 184, 0.2));
		background: var(
			--maritime-gradient-surface,
			linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))
		);
		color: var(--maritime-text-primary, #f8fafc);
		backdrop-filter: blur(18px);
		box-shadow: 0 25px 50px -20px var(--maritime-shadow, rgba(0, 0, 0, 0.4));
		transition: var(--maritime-transition, all 0.3s ease);
	}

	:global(html.light) .pw-card {
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.9));
		border: 1px solid rgba(148, 163, 184, 0.35);
		box-shadow: 0 25px 50px -20px rgba(15, 23, 42, 0.12);
		color: var(--maritime-text-primary, #0f172a);
	}

	.pw-card::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s ease;
		background: radial-gradient(circle at top, rgba(59, 130, 246, 0.12), transparent 60%);
	}

	.pw-card:hover::before {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.pw-card,
		.pw-card::before {
			transition: none;
		}
	}
</style>
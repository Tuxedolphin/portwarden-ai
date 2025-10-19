<!--
	Example Component using Centralized Theme System
	This demonstrates how to use the new theme utilities
-->
<script>
	import { THEME_VARIABLES, THEME_CLASSES, getStatusColor } from '$lib/utils/theme';

	let {
		title = 'Theme Example',
		status = 'medium',
		...restProps
	} = $props();
</script>

<!-- Using theme utility classes -->
<div class="{THEME_CLASSES.CARD} example-card" {...restProps}>
	<header class="{THEME_CLASSES.HERO} example-header">
		<h2 class="{THEME_CLASSES.TEXT_PRIMARY}">{title}</h2>
		<span 
			class="status-indicator"
			style="color: {getStatusColor(status)}"
		>
			{status.toUpperCase()}
		</span>
	</header>
	
	<div class="example-content">
		<p class="{THEME_CLASSES.TEXT_SECONDARY}">
			This component demonstrates the centralized theme system.
		</p>
		<p class="{THEME_CLASSES.TEXT_MUTED}">
			All colors, gradients, and transitions are managed centrally.
		</p>
		
		<button class="{THEME_CLASSES.BUTTON_PRIMARY} example-button">
			Theme-aware Button
		</button>
	</div>
</div>

<style>
	.example-card {
		max-width: 400px;
		margin: 1rem;
	}
	
	.example-header {
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: 1rem 1rem 0 0;
	}
	
	.status-indicator {
		font-weight: 600;
		font-size: 0.875rem;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: var(--maritime-blur);
	}
	
	.example-content {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.example-button {
		align-self: flex-start;
	}
	
	/* Alternative approach using CSS custom properties directly */
	.custom-styled {
		background: var(--maritime-gradient-surface);
		color: var(--maritime-text-primary);
		border: 1px solid var(--maritime-border);
		transition: var(--maritime-transition);
	}
	
	.custom-styled:hover {
		background: var(--maritime-gradient-surface-hover);
		border-color: var(--maritime-border-hover);
		transform: translateY(-2px);
		box-shadow: 0 10px 30px var(--maritime-shadow);
	}
</style>
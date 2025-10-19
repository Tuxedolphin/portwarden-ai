<script>
	import { theme } from '$lib/stores/theme.js';
	import { Button } from '$lib/components/ui';
	import { onMount } from 'svelte';
	import { initializeTheme, toggleTheme, getCurrentTheme } from '$lib/utils/theme';

	let {
		class: className = "",
		size = "default",
		variant = "ghost",
		...restProps
	} = $props();

	let currentTheme = $state('dark');

	// Initialize theme on mount
	onMount(() => {
		initializeTheme();
		currentTheme = getCurrentTheme();
		
		// Listen for theme changes
		const observer = new MutationObserver(() => {
			currentTheme = getCurrentTheme();
		});
		
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
		
		return () => observer.disconnect();
	});

	function handleToggle() {
		currentTheme = toggleTheme();
	}
</script>

<Button 
	{variant} 
	{size} 
	class="theme-toggle transition-all duration-300 hover:rotate-180 {className}" 
	onclick={handleToggle}
	aria-label="Toggle theme"
	{...restProps}
>
	{#if currentTheme === 'dark'}
		<!-- Sun icon for light mode -->
		<svg class="h-4 w-4 theme-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="5"/>
			<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
		</svg>
	{:else}
		<!-- Moon icon for dark mode -->
		<svg class="h-4 w-4 theme-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
		</svg>
	{/if}
</Button>

<style>
	:global(.theme-toggle) {
		background: rgba(0, 0, 0, 0.1) !important;
		border: 1px solid rgba(255, 255, 255, 0.2) !important;
		color: #f8fafc !important;
	}
	
	:global(.light .theme-toggle) {
		background: rgba(0, 0, 0, 0.1) !important;
		border: 1px solid rgba(0, 0, 0, 0.2) !important;
		color: #0f172a !important;
	}
	
	:global(.theme-toggle:hover) {
		background: rgba(0, 0, 0, 0.2) !important;
		transform: rotate(180deg) !important;
	}
	
	:global(.light .theme-toggle:hover) {
		background: rgba(0, 0, 0, 0.15) !important;
	}
	
	:global(.theme-icon) {
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
	}
	
	:global(.light .theme-icon) {
		filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.8));
	}
</style>


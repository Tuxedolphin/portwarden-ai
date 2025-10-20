<script>
	import { cn } from '$lib/utils/utils.js';
	import { createEventDispatcher } from 'svelte';

	let {
		class: className = '',
		checked = $bindable(false),
		disabled = false,
		required = false,
		value = 'on',
		name = undefined,
		id = undefined,
		indeterminate = false,
		ariaLabel = undefined,
		ariaLabelledby = undefined,
		...restProps
	} = $props();

	const dispatch = createEventDispatcher();
	let inputRef = $state(/** @type {HTMLInputElement | null} */ (null));

	$effect(() => {
		if (inputRef) {
			inputRef.indeterminate = Boolean(indeterminate) && !checked;
		}
	});

	/** @param {Event & { currentTarget: HTMLInputElement }} event */
	function handleChange(event) {
		checked = event.currentTarget.checked;
		dispatch('change', { checked, event });
	}

	/** @param {Event & { currentTarget: HTMLInputElement }} event */
	function handleInput(event) {
		checked = event.currentTarget.checked;
		dispatch('input', { checked, event });
	}
</script>

<div
	class={cn(
		'checkbox-root relative inline-flex h-5 w-5 shrink-0 items-center justify-center',
		className
	)}
>
	<input
		bind:this={inputRef}
		bind:checked
		type="checkbox"
		class="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md border border-slate-600/60 bg-slate-900/50 transition-all duration-150 ease-out checked:border-blue-400/80 checked:bg-blue-500/80 focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
		{id}
		{name}
		{value}
		{disabled}
		{required}
		aria-label={ariaLabel}
		aria-labelledby={ariaLabelledby}
		on:change={handleChange}
		on:input={handleInput}
		{...restProps}
	/>
	<span
		class="pointer-events-none flex h-full w-full items-center justify-center text-slate-200 transition-transform duration-150 ease-out peer-checked:scale-100"
	>
		<svg
			class="h-3.5 w-3.5 opacity-0 transition-opacity duration-150 ease-out peer-checked:opacity-100"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	</span>
</div>

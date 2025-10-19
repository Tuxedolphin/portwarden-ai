<script module>
	import { tv } from "tailwind-variants";

	export const selectTriggerVariants = tv({
		base: "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
		variants: {
			variant: {
				default: "border-slate-600/50 bg-slate-800/50 text-slate-200 hover:bg-slate-700/60 hover:border-slate-500/60 focus:ring-blue-400/50",
				status: "border-slate-600/50 bg-slate-800/50 text-slate-200 hover:bg-slate-700/60 hover:border-slate-500/60 focus:ring-blue-400/50 text-xs font-semibold uppercase tracking-wide"
			},
			size: {
				default: "h-10 px-3 py-2",
				sm: "h-8 px-2 py-1 text-xs rounded-full",
				lg: "h-11 px-4 py-2 text-base"
			},
			status: {
				open: "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-emerald-300 border-emerald-500/40",
				"in-progress": "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 text-amber-300 border-amber-500/40",
				resolved: "bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-300 border-blue-500/40"
			}
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		}
	});

	export const selectContentVariants = tv({
		base: "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
		variants: {
			variant: {
				default: "border-slate-600/50 bg-slate-800/90 backdrop-blur-sm text-slate-200 shadow-xl",
				status: "border-slate-600/50 bg-slate-800/90 backdrop-blur-sm text-slate-200 shadow-xl"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});

	export const selectItemVariants = tv({
		base: "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		variants: {
			variant: {
				default: "hover:bg-slate-700/50 focus:bg-slate-700/50 data-[highlighted]:bg-slate-700/50",
				status: "hover:bg-slate-700/50 focus:bg-slate-700/50 data-[highlighted]:bg-slate-700/50"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});
</script>

<script>
	import { cn } from "$lib/utils/utils.js";
	import { createEventDispatcher } from 'svelte';

	/** @typedef {"default" | "status"} SelectVariant */
	/** @typedef {"default" | "sm" | "lg"} SelectSize */

	let {
		class: className = "",
		variant = "default",
		size = "default",
		value = $bindable(),
		placeholder = "Select an option...",
		options = [],
		disabled = false,
		statusValue = undefined,
		onchange = undefined,
		children = undefined,
		...restProps
	} = $props();

	const dispatch = createEventDispatcher();

	/** @type {SelectVariant} */
	const safeVariant = $derived(
		(variant === "default" || variant === "status") 
		? variant : "default"
	);

	/** @type {SelectSize} */
	const safeSize = $derived(
		(size === "default" || size === "sm" || size === "lg") 
		? size : "default"
	);

	let isOpen = $state(false);
	let selectRef = $state(/** @type {HTMLDivElement | null} */ (null));

	function toggleOpen() {
		if (!disabled) {
			isOpen = !isOpen;
		}
	}

	/** @param {any} option */
	function selectOption(option) {
		value = option.value;
		isOpen = false;
		// Call onchange callback if provided
		if (onchange) {
			onchange({ detail: option.value });
		}
		// Also dispatch event for backward compatibility
		dispatch('change', option.value);
	}

	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		if (event.key === "Escape") {
			isOpen = false;
		}
	}

	// Close dropdown when clicking outside
	/** @param {MouseEvent} event */
	function handleClickOutside(event) {
		if (selectRef && event.target instanceof Node && !selectRef.contains(event.target)) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div bind:this={selectRef} class="relative" {...restProps}>
	<button
		type="button"
		class={cn(selectTriggerVariants({ 
			variant: safeVariant, 
			size: safeSize,
			status: statusValue 
		}), className)}
		{disabled}
		onclick={toggleOpen}
		onkeydown={handleKeydown}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
	>
		<span class="block truncate">
			{#if value}
				{options.find(opt => opt.value === value)?.label || value}
			{:else}
				{placeholder}
			{/if}
		</span>
		<svg 
			class="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
			xmlns="http://www.w3.org/2000/svg" 
			viewBox="0 0 24 24" 
			fill="none" 
			stroke="currentColor" 
			stroke-width="2"
		>
			<path d="m6 9 6 6 6-6"/>
		</svg>
	</button>

	{#if isOpen}
		<div class={cn(selectContentVariants({ variant: safeVariant }), "absolute top-full left-0 w-full mt-1 z-50")}>
			<div class="p-1 max-h-60 overflow-auto">
				{#each options as option}
					<button
						type="button"
						class={cn(selectItemVariants({ variant: safeVariant }), "cursor-pointer w-full text-left")}
						onclick={() => selectOption(option)}
						onkeydown={(e) => e.key === 'Enter' && selectOption(option)}
						role="option"
						tabindex="0"
						aria-selected={value === option.value}
					>
						<span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
							{#if value === option.value}
								<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="20,6 9,17 4,12"/>
								</svg>
							{/if}
						</span>
						{option.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
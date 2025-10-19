<script module>
	import { cn } from "$lib/utils/utils.js";
	import { tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium outline-none transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-70 aria-disabled:pointer-events-none aria-disabled:opacity-70 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
		variants: {
			variant: {
				default: "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg hover:from-blue-500 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
				destructive: "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/25 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
				outline: "border border-slate-600/50 bg-slate-800/50 text-slate-200 backdrop-blur-sm hover:bg-slate-700/60 hover:border-slate-500/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-500/10 active:translate-y-0",
				secondary: "bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 shadow-lg hover:from-slate-600 hover:to-slate-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-500/20 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
				ghost: "text-slate-300 hover:bg-slate-800/50 hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-500/10 active:translate-y-0",
				link: "text-blue-400 underline-offset-4 hover:underline hover:text-blue-300 transition-colors",
			},
			size: {
				default: "h-11 px-6 py-3 text-base font-semibold rounded-xl",
				sm: "h-9 px-4 py-2 text-sm font-medium rounded-lg",
				lg: "h-14 px-8 py-4 text-lg font-semibold rounded-2xl",
				icon: "size-11 rounded-xl",
				"icon-sm": "size-9 rounded-lg",
				"icon-lg": "size-14 rounded-2xl",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

</script>

<script>
	/** @typedef {"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"} ButtonVariant */
	/** @typedef {"default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg"} ButtonSize */
	/** @typedef {"button" | "submit" | "reset"} ButtonType */

	let {
		class: className = "",
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled = false,
		loading = false,
		children,
		...restProps
	} = $props();

	// Type-safe variant and size handling
	/** @type {ButtonVariant} */
	const safeVariant = $derived(
		(variant === "default" || variant === "destructive" || variant === "outline" || 
		 variant === "secondary" || variant === "ghost" || variant === "link") 
		? variant : "default"
	);
	
	/** @type {ButtonSize} */
	const safeSize = $derived(
		(size === "default" || size === "sm" || size === "lg" || 
		 size === "icon" || size === "icon-sm" || size === "icon-lg") 
		? size : "default"
	);
	
	/** @type {ButtonType} */
	const safeType = $derived(
		(type === "button" || type === "submit" || type === "reset") 
		? type : "button"
	);

	const isLoading = $derived(loading || disabled);
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant: safeVariant, size: safeSize }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{#if loading}
			<div class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
		{/if}
		{@render children?.()}
		{#if safeVariant === "default" && !loading}
			<svg class="transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M5 12h14m-7-7 7 7-7 7"/>
			</svg>
		{/if}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant: safeVariant, size: safeSize }), "group", className)}
		type={safeType}
		disabled={isLoading}
		{...restProps}
	>
		{#if loading}
			<div class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
		{/if}
		{@render children?.()}
		{#if safeVariant === "default" && !loading}
			<svg class="transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M5 12h14m-7-7 7 7-7 7"/>
			</svg>
		{/if}
	</button>
{/if}
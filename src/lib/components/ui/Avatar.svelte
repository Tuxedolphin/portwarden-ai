<script module>
	import { tv } from "tailwind-variants";

	export const avatarVariants = tv({
		base: "relative flex shrink-0 overflow-hidden rounded-full border-2 transition-all duration-300",
		variants: {
			size: {
				sm: "h-8 w-8 text-sm",
				default: "h-10 w-10 text-base",
				lg: "h-12 w-12 text-lg",
				xl: "h-16 w-16 text-xl",
				"2xl": "h-20 w-20 text-2xl"
			},
			variant: {
				default: "border-slate-600/50 bg-gradient-to-br from-slate-700 to-slate-800",
				primary: "border-blue-500/50 bg-gradient-to-br from-blue-500 to-blue-600",
				secondary: "border-slate-500/50 bg-gradient-to-br from-slate-600 to-slate-700",
				ai: "border-blue-400/50 bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/25"
			}
		},
		defaultVariants: {
			size: "default",
			variant: "default"
		}
	});

	export const avatarImageVariants = tv({
		base: "aspect-square h-full w-full object-cover"
	});

	export const avatarFallbackVariants = tv({
		base: "flex h-full w-full items-center justify-center font-semibold text-white",
		variants: {
			variant: {
				default: "bg-gradient-to-br from-slate-600 to-slate-700",
				primary: "bg-gradient-to-br from-blue-500 to-blue-600",
				secondary: "bg-gradient-to-br from-slate-500 to-slate-600",
				ai: "bg-gradient-to-br from-blue-400 to-blue-600"
			}
		},
		defaultVariants: {
			variant: "default"
		}
	});
</script>

<script>
	import { cn } from "$lib/utils/utils.js";

	/** @typedef {"sm" | "default" | "lg" | "xl" | "2xl"} AvatarSize */
	/** @typedef {"default" | "primary" | "secondary" | "ai"} AvatarVariant */

	let {
		class: className = "",
		size = "default",
		variant = "default",
		src = undefined,
		alt = "",
		fallback = "",
		children,
		...restProps
	} = $props();

	/** @type {AvatarSize} */
	const safeSize = $derived(
		(size === "sm" || size === "default" || size === "lg" || size === "xl" || size === "2xl") 
		? size : "default"
	);

	/** @type {AvatarVariant} */
	const safeVariant = $derived(
		(variant === "default" || variant === "primary" || variant === "secondary" || variant === "ai") 
		? variant : "default"
	);

	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleImageLoad() {
		imageLoaded = true;
		imageError = false;
	}

	function handleImageError() {
		imageError = true;
		imageLoaded = false;
	}

	// Generate initials from fallback text
	const initials = $derived(() => {
		if (!fallback) return "";
		return fallback
			.split(" ")
			.map(name => name.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	});
</script>

<div 
	class={cn(avatarVariants({ size: safeSize, variant: safeVariant }), className)}
	{...restProps}
>
	{#if src && !imageError}
		<img
			{src}
			{alt}
			class={cn(avatarImageVariants())}
			onload={handleImageLoad}
			onerror={handleImageError}
		/>
	{/if}
	
	{#if !src || imageError || !imageLoaded}
		<div class={cn(avatarFallbackVariants({ variant: safeVariant }))}>
			{#if children}
				{@render children()}
			{:else if initials}
				{initials}
			{:else}
				<svg class="h-1/2 w-1/2" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
				</svg>
			{/if}
		</div>
	{/if}
</div>
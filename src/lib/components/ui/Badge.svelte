<script module>
	import { cn } from "$lib/utils/utils.js";
	import { tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
		variants: {
			variant: {
				default: "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-400/30 shadow-sm",
				secondary: "bg-gradient-to-r from-slate-600/20 to-slate-700/20 text-slate-300 border border-slate-500/30 shadow-sm",
				destructive: "bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border border-red-400/30 shadow-sm",
				success: "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-300 border border-emerald-400/30 shadow-sm",
				warning: "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-400/30 shadow-sm",
				outline: "text-slate-300 border border-slate-500/30 bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});
</script>

<script>
	let {
		class: className = "",
		variant = "default",
		children,
		...restProps
	} = $props();

	/** @typedef {"default" | "secondary" | "outline" | "destructive" | "success" | "warning"} BadgeVariant */
	
	// Type-safe variant handling
	/** @type {BadgeVariant} */
	const safeVariant = $derived(
		(variant === "default" || variant === "secondary" || variant === "outline" || 
		 variant === "destructive" || variant === "success" || variant === "warning") 
		? variant : "default"
	);
</script>

<span
	class={cn(badgeVariants({ variant: safeVariant }), className)}
	{...restProps}
>
	{@render children?.()}
</span>
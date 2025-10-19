<script>
	import { cn } from "$lib/utils/utils.js";

	let {
		class: className = "",
		value = 0,
		max = 100,
		size = "default",
		...restProps
	} = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));

	const sizeClasses = {
		sm: "h-2",
		default: "h-3",
		lg: "h-4"
	};

	/** @typedef {"sm" | "default" | "lg"} ProgressSize */
	
	// Type-safe size handling
	/** @type {ProgressSize} */
	const safeSize = $derived(
		(size === "sm" || size === "default" || size === "lg") 
		? size : "default"
	);
	
	const sizeClass = $derived(
		safeSize === "sm" ? sizeClasses.sm :
		safeSize === "lg" ? sizeClasses.lg :
		sizeClasses.default
	);
</script>

<div
	class={cn(
		"relative w-full overflow-hidden rounded-full bg-slate-800/50 border border-slate-600/30 shadow-inner",
		sizeClass,
		className
	)}
	{...restProps}
>
	<div
		class="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 ease-out shadow-sm"
		style="width: {percentage}%"
	></div>
	<div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
</div>
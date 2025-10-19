<script>
	import { cn } from "$lib/utils/utils.js";

	let {
		class: className = "",
		children,
		...restProps
	} = $props();
</script>

<div
	class={cn(
		"rounded-2xl border border-slate-600/30 bg-gradient-to-br from-slate-800/90 to-slate-900/80 backdrop-blur-xl shadow-2xl shadow-slate-900/50",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
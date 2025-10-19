<script>
	import { cn } from "$lib/utils/utils.js";

	let {
		class: className = "",
		children,
		...restProps
	} = $props();
</script>

<p
	class={cn(
		"text-sm text-slate-400 leading-relaxed",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</p>
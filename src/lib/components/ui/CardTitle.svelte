<script>
	import { cn } from "$lib/utils/utils.js";

	let {
		class: className = "",
		children,
		...restProps
	} = $props();
</script>

<h3
	class={cn(
		"text-2xl font-semibold leading-none tracking-tight text-slate-100",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</h3>
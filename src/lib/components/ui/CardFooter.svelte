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
		"flex items-center p-6 pt-0 gap-3",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
<script>
	import { Badge } from '$lib/components/ui';
	let { tag } = $props();
</script>

<Badge variant="secondary" class="incident-tag">{tag.name}</Badge>
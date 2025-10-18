<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	/**
	 * @typedef {{ label: string; value: number }} Stat
	 */

	/** @type {Stat[]} */
	export let stats = [];
	export let loading = false;

	function handleCreate() {
		dispatch('create');
	}

	function handleRefresh() {
		dispatch('refresh');
	}
</script>

<section class="incident-hero surface-card">
	<div class="incident-hero__content">
		<div class="incident-hero__copy">
			<h1>Incident Response Mission Control</h1>
			<p>
				Track disruptions, coordinate remediation, and collaborate with ChatGPT 5 Mini to generate
				response playbooks in seconds.
			</p>
			<div class="incident-hero__actions">
				<button class="button-primary" type="button" on:click={handleCreate}>+ Log incident</button>
				<button class="button-secondary" type="button" on:click={handleRefresh} disabled={loading}>
					↻ Refresh
				</button>
			</div>
		</div>

		<aside class="incident-hero__panel surface-muted">
			<header class="incident-hero__panel-header">
				<h3>Today&apos;s posture</h3>
				<span class="incident-hero__status">ChatGPT 5 Mini online</span>
			</header>
			<ul class="incident-hero__stats">
				{#each stats as stat}
					<li>
						<span class="incident-hero__stats-label">{stat.label}</span>
						<strong>{stat.value}</strong>
					</li>
				{/each}
			</ul>
		</aside>
	</div>
</section>

<style src="./IncidentHero.css"></style>

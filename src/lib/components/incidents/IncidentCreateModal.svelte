<script>
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let title = '';
	export let description = '';
	export let tags = '';

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}

	/** @param {SubmitEvent} event */
	function submit(event) {
		event.preventDefault();
		dispatch('submit');
	}
</script>

{#if open}
	<div class="incident-modal__overlay" role="dialog" aria-modal="true">
		<div class="incident-modal surface-card">
			<header class="incident-modal__header">
				<h2>Log new incident</h2>
				<button class="incident-modal__close" type="button" on:click={close} aria-label="Close">
					×
				</button>
			</header>

			<form class="incident-modal__form" on:submit={submit}>
				<label>
					<span>Title</span>
					<input
						type="text"
						placeholder="Database latency spike in Singapore"
						bind:value={title}
						required
					/>
				</label>

				<label>
					<span>Description</span>
					<textarea
						rows="4"
						placeholder="Summarise what happened, blast radius, and known impact."
						bind:value={description}
						required
					></textarea>
				</label>

				<label>
					<span>Tags</span>
					<input type="text" placeholder="database, apac, p1" bind:value={tags} />
					<small>Separate tags with commas.</small>
				</label>

				<footer class="incident-modal__footer">
					<button class="button-secondary" type="button" on:click={close}>Cancel</button>
					<button class="button-primary" type="submit">Create incident</button>
				</footer>
			</form>
		</div>
	</div>
{/if}

<style src="./IncidentCreateModal.css"></style>

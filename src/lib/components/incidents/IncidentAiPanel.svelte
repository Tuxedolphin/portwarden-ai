<script>
	import { createEventDispatcher } from 'svelte';
	import ErrorViewer from '$lib/ErrorViewer.svelte';

	export let open = false;
	/** @type {import('$lib/types/incident').IncidentSummary | null} */
	export let incident = null;
	export let playbookOutput = '';
	export let escalationOutput = '';
	export let playbookLoading = false;
	export let escalationLoading = false;
	/** @type {ReturnType<typeof import('$lib/errorTranslator').translateError> | null} */
	export let aiError = null;

	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}

	/**
	 * @param {'playbook' | 'escalation'} intent
	 */
	function request(intent) {
		dispatch('request', { intent });
	}
</script>

{#if open && incident}
	<div class="incident-modal__overlay" role="dialog" aria-modal="true">
		<div class="incident-ai-modal surface-card">
			<header class="incident-modal__header">
				<div>
					<h2>ChatGPT 5 Mini co-pilot</h2>
					<p>Incident #{incident.id}: {incident.title}</p>
				</div>
				<button class="incident-modal__close" type="button" on:click={close} aria-label="Close">
					×
				</button>
			</header>

			<section class="incident-ai-modal__body">
				<div class="incident-ai-modal__actions">
					<button
						class="button-primary"
						type="button"
						on:click={() => request('playbook')}
						disabled={playbookLoading}
					>
						{playbookLoading ? 'Generating playbook…' : 'Generate playbook'}
					</button>
					<button
						class="button-secondary"
						type="button"
						on:click={() => request('escalation')}
						disabled={escalationLoading}
					>
						{escalationLoading ? 'Drafting summary…' : 'Draft escalation'}
					</button>
				</div>

				{#if aiError}
					<ErrorViewer errorObj={aiError} />
				{/if}

				<div class="incident-ai-modal__results">
					<article class="surface-muted">
						<header>
							<h3>Remediation playbook</h3>
						</header>
						{#if playbookOutput}
							<pre>{playbookOutput}</pre>
						{:else}
							<p class="incident-ai-modal__placeholder">
								Run the co-pilot to generate step-by-step recovery actions.
							</p>
						{/if}
					</article>

					<article class="surface-muted">
						<header>
							<h3>Escalation summary</h3>
						</header>
						{#if escalationOutput}
							<pre>{escalationOutput}</pre>
						{:else}
							<p class="incident-ai-modal__placeholder">
								Ask for an escalation brief tailored to leadership updates.
							</p>
						{/if}
					</article>
				</div>
			</section>
		</div>
	</div>
{/if}

<style src="./IncidentAiPanel.css"></style>

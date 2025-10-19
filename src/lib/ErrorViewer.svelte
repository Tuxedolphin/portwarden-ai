<script>
	/**
	 * @type {{ title?: string, message?: string, code?: string, steps?: string[], detailsPages?: string[] } | null}
	 */
	export let errorObj = null;
	/** @type {Function | null} */
	export let onRetry = null;

	let pageIndex = 0;
	let showTech = false;

	$: pages = (errorObj && errorObj.detailsPages) || [];
	$: title = (errorObj && errorObj.title) || '';
	$: message = (errorObj && errorObj.message) || '';
	$: code = (errorObj && errorObj.code) || '';
	$: steps = (errorObj && errorObj.steps) || [];

	function prev() {
		pageIndex = Math.max(0, pageIndex - 1);
	}

	function next() {
		pageIndex = Math.min(pages.length - 1, pageIndex + 1);
	}
</script>

{#if errorObj}
	<div class="error-viewer">
		<h3>{title}</h3>
		<p class="message">{message}</p>
		{#if code}
			<small class="code">Error code: {code}</small>
		{/if}

		{#if steps && steps.length}
			<div class="steps">
				<strong>How to fix</strong>
				<ol>
					{#each steps as step}
						<li>{step}</li>
					{/each}
				</ol>
			</div>
		{/if}

		<div class="controls">
			{#if onRetry}
				<button
					on:click={() => {
						if (typeof onRetry === 'function') onRetry();
					}}>Retry</button
				>
			{/if}
			<button on:click={() => (showTech = !showTech)}
				>{showTech ? 'Hide technical details' : 'Show technical details'}</button
			>
		</div>

		{#if showTech}
			<div class="tech">
				<div class="tech-header">
					<strong>Details</strong>
					<div class="pager">
						<button on:click={prev} disabled={pageIndex === 0}>Prev</button>
						<span>{pageIndex + 1}/{Math.max(1, pages.length)}</span>
						<button on:click={next} disabled={pageIndex >= pages.length - 1}>Next</button>
					</div>
				</div>
				<pre class="details">{pages[pageIndex] || 'No additional details.'}</pre>
			</div>
		{/if}
	</div>
{/if}

<style>
	.error-viewer {
		padding: 1rem;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.04);
	}
	.message {
		color: #f3f4f6;
		margin: 0.5rem 0;
	}
	.code {
		color: #94a3b8;
	}
	.steps {
		margin-top: 0.75rem;
	}
	.controls {
		margin-top: 0.75rem;
		display: flex;
		gap: 0.5rem;
	}
	.tech {
		margin-top: 0.75rem;
		border-top: 1px dashed rgba(255, 255, 255, 0.04);
		padding-top: 0.75rem;
	}
	.details {
		white-space: pre-wrap;
		max-height: 300px;
		overflow: auto;
		background: rgba(0, 0, 0, 0.3);
		padding: 0.5rem;
		border-radius: 6px;
	}
</style>

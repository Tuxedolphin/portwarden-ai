<script>
	import { Button } from '$lib/components/ui';

	let {
		showCreate = $bindable(),
		code = $bindable(''),
		description = $bindable(''),
		tags = $bindable(''),
		onCreateIncident
	} = $props();
</script>

{#if showCreate}
	<div class="modal-overlay">
		<div class="modal-container">
			<header class="modal-header">
				<h2>Create New Incident</h2>
				<button class="close-btn" onclick={() => (showCreate = false)}>×</button>
			</header>

			<form
				class="modal-form"
				onsubmit={/** @param {Event} e */ (e) => {
					e.preventDefault();
					onCreateIncident();
				}}
			>
				<div class="form-group">
					<label for="title">Incident Code</label>
					<input
						id="title"
						type="text"
						bind:value={code}
						placeholder="Enter incident code"
						required
					/>
				</div>

				<div class="form-group">
					<label for="description">Description</label>
					<textarea
						id="description"
						bind:value={description}
						placeholder="Enter Incident Description"
						rows="4"
						required
					></textarea>
				</div>

				<div class="form-group">
					<label for="tags">Tags</label>
					<input
						id="tags"
						type="text"
						bind:value={tags}
						placeholder="Enter tags separated by commas"
					/>
					<small class="form-hint">Separate multiple tags with commas</small>
				</div>

				<footer class="modal-footer">
					<Button variant="outline" type="button" onclick={() => (showCreate = false)}>
						Cancel
					</Button>
					<Button type="submit">Create Incident</Button>
				</footer>
			</form>
		</div>
	</div>
{/if}

<style>
	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(10px);
	}

	.modal-container {
		background: var(--maritime-gradient-surface);
		border: 1px solid var(--maritime-border);
		border-radius: 1.5rem;
		width: min(90vw, 600px);
		max-height: 90vh;
		overflow-y: auto;
		scrollbar-color: rgba(100, 116, 139, 0.6) rgba(15, 23, 42, 0.9);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	:global(html.light) .modal-container {
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.9));
		border: 1px solid rgba(148, 163, 184, 0.35);
		box-shadow: 0 25px 50px -20px rgba(15, 23, 42, 0.12);
		scrollbar-color: rgba(148, 163, 184, 0.5) rgba(226, 232, 240, 0.9);
	}

	.modal-container::-webkit-scrollbar {
		width: 0.5rem;
	}

	.modal-container::-webkit-scrollbar-track {
		background: rgba(15, 23, 42, 0.9);
		border-radius: 999px;
	}

	.modal-container::-webkit-scrollbar-thumb {
		background: rgba(100, 116, 139, 0.6);
		border-radius: 999px;
	}

	:global(html.light) .modal-container::-webkit-scrollbar-track {
		background: rgba(226, 232, 240, 0.9);
	}

	:global(html.light) .modal-container::-webkit-scrollbar-thumb {
		background: rgba(148, 163, 184, 0.5);
	}

	.modal-container::-webkit-scrollbar-thumb:hover {
		background: rgba(148, 163, 184, 0.75);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid var(--maritime-border);
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--maritime-text-primary);
		margin: 0;
	}

	:global(html.light) .modal-header h2 {
		color: #0f172a;
	}

	.close-btn {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		background: rgba(148, 163, 184, 0.2);
		color: #94a3b8;
		border-radius: 50%;
		font-size: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(html.light) .close-btn {
		background: rgba(148, 163, 184, 0.25);
		color: #475569;
	}

	.close-btn:hover {
		background: rgba(239, 68, 68, 0.2);
		color: #fecaca;
	}

	.modal-form {
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 600;
		color: var(--maritime-text-primary);
		margin-bottom: 0.5rem;
	}

	:global(html.light) .form-group label {
		color: #0f172a;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 1rem;
		border: 1px solid var(--maritime-border);
		border-radius: 0.75rem;
		background: rgba(15, 23, 42, 0.8);
		color: var(--maritime-text-secondary);
		font-size: 1rem;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
	}

	:global(html.light) .form-group input,
	:global(html.light) .form-group textarea {
		background: rgba(255, 255, 255, 0.95);
		color: #1e293b;
		border: 1px solid rgba(148, 163, 184, 0.4);
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: rgba(59, 130, 246, 0.6);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-hint {
		display: block;
		font-size: 0.85rem;
		color: var(--maritime-text-muted);
		margin-top: 0.25rem;
	}

	:global(html.light) .form-hint {
		color: #475569;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		.modal-container {
			margin: 1rem;
			width: calc(100vw - 2rem);
		}

		.modal-header,
		.modal-form {
			padding: 1.5rem;
		}
	}
</style>

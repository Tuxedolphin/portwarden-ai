<script>
	import { Button } from '$lib/components/ui';
	
	let { 
		showCreate = $bindable(),
		title = $bindable(''),
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

			<form class="modal-form" onsubmit={/** @param {Event} e */ (e) => { e.preventDefault(); onCreateIncident(); }}>
				<div class="form-group">
					<label for="title">Incident Title</label>
					<input
						id="title"
						type="text"
						bind:value={title}
						placeholder="Enter incident title"
						required
					/>
				</div>

				<div class="form-group">
					<label for="description">Description</label>
					<textarea
						id="description"
						bind:value={description}
						placeholder="Describe the incident in detail"
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
		background: linear-gradient(145deg, #0f172a, #1e293b);
		border: 1px solid rgba(148, 163, 184, 0.3);
		border-radius: 1.5rem;
		width: min(90vw, 600px);
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid rgba(148, 163, 184, 0.2);
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #f8fafc;
		margin: 0;
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
		color: #e2e8f0;
		margin-bottom: 0.5rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 1rem;
		border: 1px solid rgba(148, 163, 184, 0.3);
		border-radius: 0.75rem;
		background: rgba(15, 23, 42, 0.8);
		color: #e2e8f0;
		font-size: 1rem;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
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
		color: #94a3b8;
		margin-top: 0.25rem;
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
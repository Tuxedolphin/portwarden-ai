<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	import { translateError } from '$lib/errorTranslator';

	// Import our new components
	import {
		HeroHeader,
		IncidentGrid,
		CreateIncidentModal,
		PaginationControls,
		AIPanel
	} from '$lib/components/incidents';

	/** @type {Array<any>} */
	let items = [];
	let total = 0;
	let page = 1;
	let pageSize = 10;
	let showCreate = false;
	let code = '';
	let description = '';
	let tags = '';
	let toast = '';

	// AI Co-pilot state
	/** @type {any | null} */
	let selectedIncident = null;
	let playbookOutput = '';
	/** @type {import('$lib/types/playbook').PlaybookPayload | null} */
	let playbookPayload = null;
	let escalationOutput = '';
	let playbookLoading = false;
	let escalationLoading = false;
	let showAiPanel = false;
	/** @type {{ title?: string, message?: string, code?: string, steps?: string[], detailsPages?: string[] } | null} */
	let errorObj = null;

	// Status options for Select component
	const statusOptions = [
		{ value: 'open', label: 'Open' },
		{ value: 'in-progress', label: 'In Progress' },
		{ value: 'resolved', label: 'Resolved' }
	];

	async function load() {
		const res = await fetch(`/api/incidents?page=${page}&pageSize=${pageSize}`);
		const data = await res.json();
		items = data.results || [];
		total = data.total || 0;
	}

	async function createIncident() {
		toast = '';
		try {
			const res = await fetch('/api/incidents', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					caseCode: code,
					description,
					tags: tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean)
				})
			});

			const data = await res.json();

			if (!res.ok) throw new Error(data?.error || 'Failed to create incident');

			showCreate = false;
			code = '';
			description = '';
			tags = '';

			await load();
		} catch (e) {
			toast = e instanceof Error ? e.message : 'Create failed';
		}
	}

	/** @param {number} id */
	async function archive(id) {
		const res = await fetch(`/api/incidents/${id}/archive`, { method: 'POST' });
		if (!res.ok) {
			toast = 'Archive failed';
			return;
		}
		await load();
	}

	/** @param {number} id @param {string} newStatus */
	async function updateStatus(id, newStatus) {
		toast = '';
		try {
			const res = await fetch(`/api/incidents/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error?.error || 'Failed to update status');
			}
			await load();
		} catch (e) {
			toast = e instanceof Error ? e.message : 'Update failed';
		}
	}

	/** @param {any} incident */
	function selectIncidentForAI(incident) {
		selectedIncident = incident;
		playbookOutput = '';
		playbookPayload = null;
		escalationOutput = '';
		errorObj = null;
		showAiPanel = true;
	}

	/** @param {string} type */
	async function requestGpt5(type) {
		if (!selectedIncident) return;

		const loadingKey = type === 'playbook' ? 'playbookLoading' : 'escalationLoading';
		const outputKey = type === 'playbook' ? 'playbookOutput' : 'escalationOutput';

		try {
			if (type === 'playbook') {
				playbookLoading = true;
			} else {
				escalationLoading = true;
			}

			errorObj = null;

			const response = await fetch('/api/gpt5', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					incidentId: selectedIncident.id,
					intent: type
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error || 'GPT-5 request failed');
			}

			if (type === 'playbook') {
				playbookOutput = data.output || '';
				playbookPayload = data.payload ?? null;
			} else {
				escalationOutput = data.output || '';
			}
		} catch (e) {
			console.error('GPT-5 request failed:', e);
			errorObj = translateError(e);
			if (type === 'playbook') {
				playbookPayload = null;
			}
		} finally {
			if (type === 'playbook') {
				playbookLoading = false;
			} else {
				escalationLoading = false;
			}
		}
	}

	// Navigation handlers
	function handlePrevious() {
		page--;
		load();
	}

	function handleNext() {
		page++;
		load();
	}

	onMount(load);
</script>

<Header />

<HeroHeader {items} onNewIncident={() => (showCreate = true)} />

<!-- Main Content Section -->
<section class="incidents-content">
	{#if toast}
		<div class="toast">{toast}</div>
	{/if}

	<IncidentGrid
		{items}
		{statusOptions}
		onStatusUpdate={updateStatus}
		onSelectForAI={selectIncidentForAI}
		onArchive={archive}
		onCreateIncident={() => (showCreate = true)}
	/>

	<PaginationControls {page} {pageSize} {total} onPrevious={handlePrevious} onNext={handleNext} />
</section>

<CreateIncidentModal
	bind:showCreate
	bind:code
	bind:description
	bind:tags
	onCreateIncident={createIncident}
/>

<style>
	/* Main Content */
	.incidents-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem 4rem;
		/* Remove explicit background to inherit from body */
		transition: background 0.3s ease;
		min-height: 60vh;
	}

	.toast {
		padding: 1rem 1.5rem;
		border-radius: 1rem;
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1));
		border: 1px solid rgba(248, 113, 113, 0.3);
		color: var(--maritime-status-critical, #fecaca);
		margin-bottom: 2rem;
		backdrop-filter: blur(10px);
		transition:
			background 0.3s ease,
			border-color 0.3s ease,
			color 0.3s ease;
	}

	:global(html.light) .toast {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
		border: 1px solid rgba(248, 113, 113, 0.4);
		color: var(--maritime-status-critical, #dc2626);
	}
</style>

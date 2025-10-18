<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import IncidentHero from '$lib/components/incidents/IncidentHero.svelte';
	import IncidentGrid from '$lib/components/incidents/IncidentGrid.svelte';
	import IncidentPagination from '$lib/components/incidents/IncidentPagination.svelte';
	import IncidentCreateModal from '$lib/components/incidents/IncidentCreateModal.svelte';
	import IncidentAiPanel from '$lib/components/incidents/IncidentAiPanel.svelte';
	import ErrorViewer from '$lib/ErrorViewer.svelte';
	import { translateError } from '$lib/errorTranslator';
	import {
		fetchIncidents as fetchIncidentsApi,
		createIncident as createIncidentApi,
		updateIncidentStatus as updateIncidentStatusApi,
		archiveIncident as archiveIncidentApi,
		requestIncidentAi as requestIncidentAiApi
	} from '$lib/api/incidents';
	import { parseTags } from '$lib/utils/tags';

	/** @typedef {import('$lib/types/incident').IncidentSummary} IncidentSummary */
	/** @typedef {import('$lib/types/incident').IncidentStatus} IncidentStatus */

	const pageSize = 6;

	let page = 1;
	let total = 0;
	/** @type {IncidentSummary[]} */
	let items = [];
	let loading = true;
	let toast = '';
	/** @type {ReturnType<typeof translateError> | null} */
	let errorObj = null;

	let showCreate = false;
	let title = '';
	let description = '';
	let tags = '';

	let showAiPanel = false;
	/** @type {IncidentSummary | null} */
	let selectedIncident = null;
	let playbookLoading = false;
	let escalationLoading = false;
	let playbookOutput = '';
	let escalationOutput = '';
	/** @type {ReturnType<typeof translateError> | null} */
	let aiError = null;

	/** @type {Record<IncidentStatus, string>} */
	const statusLabels = {
		open: 'Open',
		'in-progress': 'In Progress',
		resolved: 'Resolved'
	};

	/** @type {IncidentStatus[]} */
	const statusOptions = ['open', 'in-progress', 'resolved'];

	$: totalPages = Math.max(1, Math.ceil(total / pageSize));
	$: openCount = items.filter((incident) => incident.status === 'open').length;
	$: inProgressCount = items.filter((incident) => incident.status === 'in-progress').length;
	$: resolvedCount = items.filter((incident) => incident.status === 'resolved').length;
	$: stats = [
		{ label: 'Open incidents', value: openCount },
		{ label: 'In progress', value: inProgressCount },
		{ label: 'Resolved (7d)', value: resolvedCount }
	];

	onMount(loadIncidents);

	async function loadIncidents() {
		loading = true;
		toast = '';
		errorObj = null;

		try {
			const { results, total: totalCount } = await fetchIncidentsApi({ page, pageSize });
			items = results;
			total = totalCount;
		} catch (error) {
			errorObj = translateError(error);
			toast = errorObj?.message ?? 'Failed to load incidents.';
		} finally {
			loading = false;
		}
	}

	function resetCreateForm() {
		title = '';
		description = '';
		tags = '';
	}

	function closeCreateModal() {
		showCreate = false;
		resetCreateForm();
	}

	async function submitCreate() {
		toast = '';

		try {
			await createIncidentApi({
				title,
				description,
				tags: parseTags(tags)
			});
			closeCreateModal();
			await loadIncidents();
			toast = 'Incident created successfully.';
		} catch (error) {
			errorObj = translateError(error);
			toast = errorObj?.message ?? 'Failed to create incident.';
		}
	}

	/**
	 * @param {IncidentSummary['id']} incidentId
	 * @param {IncidentStatus} newStatus
	 */
	async function setStatus(incidentId, newStatus) {
		toast = '';

		try {
			await updateIncidentStatusApi(incidentId, newStatus);
			items = items.map((incident) =>
				incident.id === incidentId ? { ...incident, status: newStatus } : incident
			);
		} catch (error) {
			errorObj = translateError(error);
			toast = errorObj?.message ?? 'Failed to update status.';
		}
	}

	/** @param {IncidentSummary['id']} incidentId */
	async function archiveIncident(incidentId) {
		toast = '';

		try {
			await archiveIncidentApi(incidentId);
			await loadIncidents();
			toast = 'Incident archived.';
		} catch (error) {
			errorObj = translateError(error);
			toast = errorObj?.message ?? 'Failed to archive incident.';
		}
	}

	/** @param {IncidentSummary} incident */
	function openAiPanel(incident) {
		selectedIncident = incident;
		showAiPanel = true;
		playbookOutput = '';
		escalationOutput = '';
		aiError = null;
	}

	function closeAiPanel() {
		showAiPanel = false;
		selectedIncident = null;
		playbookOutput = '';
		escalationOutput = '';
		aiError = null;
	}

	/**
	 * @param {'playbook' | 'escalation'} intent
	 */
	async function requestAi(intent) {
		if (!selectedIncident) return;

		aiError = null;

		if (intent === 'playbook') {
			playbookLoading = true;
		} else {
			escalationLoading = true;
		}

		try {
			const data = await requestIncidentAiApi(selectedIncident.id, intent);
			if (intent === 'playbook') {
				playbookOutput = data.output ?? '';
			} else {
				escalationOutput = data.output ?? '';
			}
		} catch (error) {
			aiError = translateError(error);
		} finally {
			playbookLoading = false;
			escalationLoading = false;
		}
	}

	function nextPage() {
		if (page < totalPages) {
			page += 1;
			loadIncidents();
		}
	}

	function prevPage() {
		if (page > 1) {
			page -= 1;
			loadIncidents();
		}
	}
</script>

<svelte:head>
	<title>Incident Response | Portwarden AI</title>
</svelte:head>

<Header />

<main class="incidents-view">
	<IncidentHero
		{stats}
		{loading}
		on:create={() => (showCreate = true)}
		on:refresh={loadIncidents}
	/>

	{#if toast}
		<div class="toast" role="status">{toast}</div>
	{/if}

	{#if errorObj}
		<section class="surface-card">
			<ErrorViewer {errorObj} onRetry={loadIncidents} />
		</section>
	{/if}

	<IncidentGrid
		incidents={items}
		{loading}
		{statusLabels}
		{statusOptions}
		on:create={() => (showCreate = true)}
		on:statuschange={(event) => setStatus(event.detail.incidentId, event.detail.status)}
		on:archive={(event) => archiveIncident(event.detail.incidentId)}
		on:ai={(event) => openAiPanel(event.detail.incident)}
	/>

	<IncidentPagination {page} {totalPages} on:prev={prevPage} on:next={nextPage} />
</main>

<IncidentCreateModal
	bind:open={showCreate}
	bind:title
	bind:description
	bind:tags
	on:close={closeCreateModal}
	on:submit={submitCreate}
/>

<IncidentAiPanel
	open={showAiPanel}
	incident={selectedIncident}
	{playbookOutput}
	{escalationOutput}
	{playbookLoading}
	{escalationLoading}
	{aiError}
	on:close={closeAiPanel}
	on:request={(event) => requestAi(event.detail.intent)}
/>

<style src="$lib/styles/incidents/page.css"></style>

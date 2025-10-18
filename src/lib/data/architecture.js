export const layers = [
	{
		id: 'ingestion',
		title: 'Unified Data Ingestion',
		kicker: 'Layer 1',
		description:
			'Normalizes email, SMS, EDI, and API telemetry into a single incident graph so duty officers see the full operational context instantly.'
	},
	{
		id: 'correlation',
		title: 'AI Correlation Engine',
		kicker: 'Layer 2',
		description:
			'Links alerts to live logs, database evidence, and workflow states using semantic matching and correlation IDs for immediate validation.'
	},
	{
		id: 'remediation',
		title: 'Guided Remediation Co-Pilot',
		kicker: 'Layer 3',
		description:
			'Generates playbooks, SQL fixes, and escalation briefs with Gemini-based RAG so the first responder can resolve or delegate within minutes.'
	}
];

export const impactHighlights = [
	{
		label: 'Alerts auto-correlated',
		value: '3/3',
		subtext: 'Every sample incident resolves to verified technical evidence.'
	},
	{
		label: 'SQL-ready fixes',
		value: '4',
		subtext: 'Knowledge base playbooks preloaded for immediate execution.'
	},
	{
		label: 'Escalation latency',
		value: '< 2 min',
		subtext: 'Gemini drafts summaries and owner routing on demand.'
	}
];

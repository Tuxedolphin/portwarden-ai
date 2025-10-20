export const PRODUCT_ESCALATION_CONTACTS = [
	{
		category: 'Container',
		code: 'CNTR',
		primaryContact: {
			name: 'Mark Lee',
			email: 'mark.lee@psa123.com',
			role: 'Product Ops Manager'
		},
		responsibilities: 'Oversees all container-related product incidents and operational issues.',
		guidelines: [
			'Notify the Product Duty contact immediately.',
			'If unresolved quickly escalate to the on-call manager.',
			'Engage the SRE/Infra team when platform-level intervention is required.'
		]
	},
	{
		category: 'Vessel',
		code: 'VS',
		primaryContact: {
			name: 'Jaden Smith',
			email: 'jaden.smith@psa123.com',
			role: 'Vessel Operations Lead'
		},
		responsibilities: 'Coordinates vessel management issues and complex troubleshooting.',
		guidelines: [
			'Page the Vessel Duty team first.',
			'If there is no response, escalate to the Senior Ops Manager.',
			'Loop in the Vessel Static team for deeper diagnostics as needed.'
		]
	},
	{
		category: 'EDI/API',
		code: 'EA',
		primaryContact: {
			name: 'Tom Tan',
			email: 'tom.tan@psa123.com',
			role: 'EDI/API Support Lead'
		},
		responsibilities:
			'Handles EDI/API incidents covering message validation, partner communication, and integration errors.',
		guidelines: [
			'Contact the EDI/API on-call channel immediately.',
			'Escalate to the Infra/SRE team for sustained API failures.',
			'Coordinate with partner organizations if issues continue.'
		]
	},
	{
		category: 'Infrastructure / SRE',
		code: 'INFRA',
		primaryContact: {
			name: 'Jacky Chan',
			email: 'jacky.chan@psa123.com',
			role: 'Infra/SRE Support Lead'
		},
		responsibilities:
			'Responds to system infrastructure problems such as latency or network instability.',
		guidelines: [
			'Engage the Infra team immediately for any platform outage symptoms.',
			'Highlight urgent cases directly to Jacky Chan (SRE lead).'
		]
	},
	{
		category: 'Helpdesk',
		code: 'HELPDESK',
		primaryContact: {
			name: 'PSA Helpdesk',
			email: 'support@psa123.com',
			role: 'General Support'
		},
		responsibilities: 'Frontline for general inquiries and non-technical escalations.',
		guidelines: [
			'Route non-urgent queries to the helpdesk team lead.',
			'For emergencies, trigger the on-call operations team immediately.'
		]
	}
];

export const ESCALATION_CONTACT_CATEGORIES = PRODUCT_ESCALATION_CONTACTS.map(
	(entry) => entry.category
);

export function formatContactsForPrompt() {
	return PRODUCT_ESCALATION_CONTACTS.map((entry) => {
		const lines = [
			`${entry.category} (${entry.code})`,
			`Primary: ${entry.primaryContact.name} <${entry.primaryContact.email}> (${entry.primaryContact.role})`,
			`Responsibilities: ${entry.responsibilities}`,
			`Guidelines: ${entry.guidelines.join(' | ')}`
		];
		return lines.join('\n');
	}).join('\n\n');
}

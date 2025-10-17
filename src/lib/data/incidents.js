/**
 * @typedef {Object} IncidentAction
 * @property {string} label
 * @property {string} explanation
 * @property {string} cite
 * @property {'sql' | 'command' | 'template'} artifactType
 * @property {string} artifact
 */

/**
 * @typedef {Object} IncidentEvidence
 * @property {string} type
 * @property {string} source
 * @property {string} message
 * @property {string=} timestamp
 * @property {string=} correlationId
 * @property {string=} insight
 */

/**
 * @typedef {Object} IncidentKnowledge
 * @property {string} reference
 * @property {string} title
 * @property {string} summary
 */

/**
 * @typedef {Object} IncidentEscalation
 * @property {boolean} required
 * @property {string} summary
 * @property {string=} owner
 * @property {string=} team
 * @property {string=} channel
 * @property {string=} escalationNote
 */

/**
 * @typedef {Object} Incident
 * @property {string} id
 * @property {string} displayId
 * @property {string} title
 * @property {string} summary
 * @property {string} channel
 * @property {string} severity
 * @property {string} persona
 * @property {string} occurredAt
 * @property {{ label: string; value: string }[]} ingestion
 * @property {IncidentEvidence[]} correlatedEvidence
 * @property {IncidentKnowledge[]} knowledgeBase
 * @property {IncidentAction[]} recommendedActions
 * @property {IncidentEscalation} escalation
 * @property {string} ragExtract
 */

/** @type {Incident[]} */
export const incidents = [
	{
		id: 'ALR-861600',
		displayId: 'ALR-861600',
		title: 'Duplicate container snapshot detected',
		summary:
			'Data quality monitor detected that container CMAU0000020 was inserted twice within one second, creating inconsistent yard inventory views.',
		channel: 'Email',
		severity: 'Medium',
		persona: 'Yard Duty Officer',
		occurredAt: '2025-10-09T08:15:12.516Z',
		ingestion: [
			{ label: 'Container', value: 'CMAU0000020' },
			{ label: 'Alert', value: 'DuplicateSnapshotAttempt' },
			{ label: 'Reporter', value: 'container-version service monitor' }
		],
		correlatedEvidence: [
			{
				type: 'log',
				source: 'container_service.log',
				timestamp: '2025-10-09T08:15:12.516Z',
				message: 'WARN container-version DuplicateSnapshotAttempt cntr_no=CMAU0000020',
				correlationId: 'corr-cmau-dup-01',
				insight: 'Latest ETL run attempted to upsert a snapshot that already exists.'
			},
			{
				type: 'sql',
				source: 'container (db.sql)',
				message: 'Two rows share cntr_no CMAU0000020 with the same timestamps.',
				insight:
					'Historical snapshots should be unique per timestamp; duplicate indicates upstream replay.'
			}
		],
		knowledgeBase: [
			{
				reference: 'KB-2210',
				title: 'CNTR: Duplicate Container information received',
				summary:
					'Duplicates occur when upstream retry logic resends an already committed snapshot. Confirm the row counts, keep the newest entry, and archive redundant records to maintain lineage.'
			}
		],
		recommendedActions: [
			{
				label: 'Detect duplicate snapshots',
				explanation: 'Confirm multiple snapshots exist for CMAU0000020 before adjusting data.',
				cite: 'KB-2210',
				artifactType: 'sql',
				artifact:
					"SELECT cntr_no, COUNT(*) AS snapshot_count\nFROM container\nWHERE cntr_no = 'CMAU0000020'\nGROUP BY cntr_no;"
			},
			{
				label: 'Retain most recent snapshot only',
				explanation: 'Archive older duplicate rows while preserving the latest operational state.',
				cite: 'KB-2210',
				artifactType: 'sql',
				artifact:
					"DELETE FROM container\nWHERE cntr_no = 'CMAU0000020'\nAND created_at < (\n\tSELECT MAX(created_at) FROM container WHERE cntr_no = 'CMAU0000020'\n);"
			},
			{
				label: 'Rebuild cache consumers',
				explanation:
					'Trigger downstream sync to ensure API consumers pick up the corrected snapshot.',
				cite: 'KB-2210',
				artifactType: 'command',
				artifact: 'POST /ops/cache-refresh { "entity": "container", "cntrNo": "CMAU0000020" }'
			}
		],
		escalation: {
			required: false,
			summary: 'Self-healable data quality issue once duplicates are purged.'
		},
		ragExtract:
			"Incident ALR-861600 flagged duplicate container snapshot attempts for CMAU0000020. Logs show 'DuplicateSnapshotAttempt' warning and the database file db.sql contains two rows for this container. Knowledge base article KB-2210 explains how to confirm duplicate snapshots, delete older history, and refresh caches. Duty officer persona is Yard Duty Officer who can execute SQL in the operational replica."
	},
	{
		id: 'ALR-861631',
		displayId: 'ALR-861631',
		title: 'VESSEL_ERR_4 blocks vessel advice creation',
		summary:
			'Duty officer reporting that MV Lion City 07 returns VESSEL_ERR_4 when creating a new vessel advice from the portal.',
		channel: 'Email',
		severity: 'High',
		persona: 'Vessel Planning',
		occurredAt: '2025-10-08T09:14:12.419Z',
		ingestion: [
			{ label: 'Vessel Name', value: 'MV Lion City 07' },
			{ label: 'Error Code', value: 'VESSEL_ERR_4' },
			{ label: 'Impact', value: 'User unable to create vessel advice' }
		],
		correlatedEvidence: [
			{
				type: 'log',
				source: 'vessel_advice_service.log',
				timestamp: '2025-10-08T09:14:12.419Z',
				message:
					'ERROR AdviceService corrId=9fa2e7c1afad4d6a code=VESSEL_ERR_4 msg="System Vessel Name has been used by other vessel advice"',
				correlationId: '9fa2e7c1afad4d6a',
				insight: 'Confirms backend rejects duplicate active advice names.'
			},
			{
				type: 'sql',
				source: 'vessel_advice (db.sql)',
				message:
					"SELECT vessel_advice_no, effective_end_datetime FROM vessel_advice WHERE system_vessel_name = 'MV Lion City 07' AND effective_end_datetime IS NULL;",
				insight: 'Active advice 1000010960 already owns the vessel name.'
			}
		],
		knowledgeBase: [
			{
				reference: 'KB-1749',
				title: 'VAS: VESSEL_ERR_4 Vessel Name has been used by other vessel advice',
				summary:
					'Only one active vessel advice can share the system vessel name. Expire the current advice after ensuring dependant port programs are closed.'
			},
			{
				reference: 'KB-1754',
				title: 'Check for active berth applications before expiring advice',
				summary: 'Ensure no open berth applications reference the vessel advice before expiry.'
			},
			{
				reference: 'KB-1767',
				title: 'Expire vessel advice via SQL maintenance window',
				summary:
					'Expire the historical record by stamping effective_end_datetime and documenting in operations log.'
			}
		],
		recommendedActions: [
			{
				label: 'Confirm active advice',
				explanation: 'Validate existing advice blocking the new record.',
				cite: 'KB-1749',
				artifactType: 'sql',
				artifact:
					"SELECT vessel_advice_no, effective_end_datetime\nFROM vessel_advice\nWHERE system_vessel_name = 'MV Lion City 07'\nAND effective_end_datetime IS NULL;"
			},
			{
				label: 'Check berth applications referencing advice',
				explanation:
					'Ensure no active berth applications depend on the current advice before expiring it.',
				cite: 'KB-1754',
				artifactType: 'sql',
				artifact:
					"SELECT application_no\nFROM berth_application\nWHERE vessel_advice_no = 1000010960\nAND vessel_close_datetime IS NULL\nAND deleted = 'N';"
			},
			{
				label: 'Expire legacy advice',
				explanation: 'Set end timestamp so the new advice can be created.',
				cite: 'KB-1767',
				artifactType: 'sql',
				artifact:
					"UPDATE vessel_advice\nSET effective_end_datetime = '2025-10-08 09:15:00'\nWHERE vessel_advice_no = 1000010960\nAND effective_end_datetime IS NULL;"
			},
			{
				label: 'Notify requestor',
				explanation: 'Let the user know they can retry creating the advice after the change.',
				cite: 'KB-1767',
				artifactType: 'template',
				artifact:
					'Subject: MV Lion City 07 advice unblocked\nBody: Legacy advice 1000010960 expired at 09:15 UTC. Please retry portal submission.'
			}
		],
		escalation: {
			required: false,
			summary: 'Resolved by operations once legacy advice expired; no escalation necessary.'
		},
		ragExtract:
			"Incident ALR-861631 corresponds to VESSEL_ERR_4 for MV Lion City 07. Logs show correlation ID 9fa2e7c1afad4d6a with message 'System Vessel Name has been used by other vessel advice'. Database query from db.sql confirms active advice 1000010960 holds the name. Knowledge base entries KB-1749, KB-1754, KB-1767 describe verification of berth applications and expiring the advice before notifying the user."
	},
	{
		id: 'INC-154599',
		displayId: 'INC-154599',
		title: 'EDI IFTMIN error REF-IFT-0007',
		summary:
			'SMS alert flagged inbound EDI IFTMIN message stuck in ERROR with message reference REF-IFT-0007 between LINE-PSA and PSA-TOS.',
		channel: 'SMS',
		severity: 'High',
		persona: 'EDI Duty Officer',
		occurredAt: '2025-10-04T12:25:10.529Z',
		ingestion: [
			{ label: 'Message Ref', value: 'REF-IFT-0007' },
			{ label: 'Status', value: 'ERROR' },
			{ label: 'Sender', value: 'LINE-PSA' },
			{ label: 'Receiver', value: 'PSA-TOS' }
		],
		correlatedEvidence: [
			{
				type: 'log',
				source: 'edi_advice_service.log',
				timestamp: '2025-10-04T12:25:10.529Z',
				message:
					'ERROR EDIService corrId=ab72d0a1e9f8f9cd code=EDI_ERR_1 msg="Segment missing" message_ref="REF-IFT-0007"',
				correlationId: 'ab72d0a1e9f8f9cd',
				insight: 'Parser rejected the interchange because a mandatory segment is absent.'
			},
			{
				type: 'sql',
				source: 'edi_message (db.sql)',
				message:
					"SELECT status, error_text, ack_at FROM edi_message WHERE message_ref = 'REF-IFT-0007';",
				insight: 'Row shows status ERROR and NULL ack_at consistent with incident.'
			}
		],
		knowledgeBase: [
			{
				reference: 'KB-1988',
				title: 'EDI: EDI Message Timeout or Delay in Acknowledgment',
				summary:
					'When inbound EDI remains in ERROR with missing acknowledgement, inspect parser logs, request resend with corrected segments, and annotate trading partner portal.'
			}
		],
		recommendedActions: [
			{
				label: 'Confirm parser failure details',
				explanation: 'Validate exact error message for the trading partner.',
				cite: 'KB-1988',
				artifactType: 'sql',
				artifact:
					"SELECT error_text, raw_text\nFROM edi_message\nWHERE message_ref = 'REF-IFT-0007';"
			},
			{
				label: 'Request resend with missing segment',
				explanation: 'Communicate the missing segment so the partner can correct the interchange.',
				cite: 'KB-1988',
				artifactType: 'template',
				artifact:
					'Subject: Action required - REF-IFT-0007\nBody: Parser rejected REF-IFT-0007 (EDI_ERR_1 Segment missing). Please resend with mandatory segment header 16.'
			},
			{
				label: 'Annotate trading partner portal',
				explanation: 'Record the exception in the partner SLA tracker.',
				cite: 'KB-1988',
				artifactType: 'command',
				artifact:
					'PATCH /partners/LINE-PSA/messages/REF-IFT-0007 { "status": "Awaiting resend", "note": "Mandatory segment missing" }'
			}
		],
		escalation: {
			required: false,
			summary: 'Partner resend expected; escalate only if resend not received within SLA.'
		},
		ragExtract:
			"Incident INC-154599 references EDI message REF-IFT-0007 stuck in ERROR. Logs show correlation ab72d0a1e9f8f9cd with code EDI_ERR_1 and message 'Segment missing'. Database row in edi_message table confirms ERROR status with NULL ack_at. Knowledge base KB-1988 outlines steps to confirm parser details, request corrected resend, and document partner communication."
	},
	{
		id: 'TCK-742311',
		displayId: 'TCK-742311',
		title: 'BAPLIE inconsistency for MV PACIFIC DAWN/07E',
		summary:
			'Planning team notes BAPLIE plan still shows units in bay 14 even though COARRI indicates load complete, suggesting the plan regressed to an older timestamp.',
		channel: 'ServiceNow',
		severity: 'Critical',
		persona: 'Vessel Duty Lead',
		occurredAt: '2025-10-07T04:32:00Z',
		ingestion: [
			{ label: 'Module', value: 'Vessel (VS)' },
			{ label: 'Vessel', value: 'MV PACIFIC DAWN/07E' },
			{ label: 'Symptom', value: 'BAPLIE shows units in bay 14 despite load complete' }
		],
		correlatedEvidence: [
			{
				type: 'log',
				source: 'planning_sync.log',
				timestamp: '2025-10-07T04:29:44.902Z',
				message:
					'WARN PlanningSync corrId=vs-baplie-07E detected older timestamp 2025-10-07T04:20:00Z overwriting stowage plan',
				correlationId: 'vs-baplie-07E',
				insight: 'Confirms replication applied stale file and regressed bay data.'
			},
			{
				type: 'log',
				source: 'edi_coarri.log',
				timestamp: '2025-10-07T04:22:11.337Z',
				message:
					'INFO COARRI corrId=vs-baplie-07E bay=14 status=complete message_ref="REF-ARR-0714"',
				correlationId: 'vs-baplie-07E',
				insight: 'Confirms COARRI indicated bay load completion before regression.'
			}
		],
		knowledgeBase: [
			{
				reference: 'KB-2301',
				title: 'BAPLIE inconsistency for vessel plan',
				summary:
					'Identify the offending interchange, reapply the newest stowage file, and alert vessel duty to verify yard sync.'
			}
		],
		recommendedActions: [
			{
				label: 'Lock stowage plan updates',
				explanation: 'Prevent further regressions while reapplying the correct file.',
				cite: 'KB-2301',
				artifactType: 'command',
				artifact:
					'POST /planning/locks { "vesselId": "MV PACIFIC DAWN/07E", "reason": "BAPLIE regression" }'
			},
			{
				label: 'Replay latest BAPLIE interchange',
				explanation: 'Force system to ingest the newest plan and override stale data.',
				cite: 'KB-2301',
				artifactType: 'command',
				artifact: 'POST /edi/replay { "messageRef": "REF-BAP-07E-LATEST" }'
			},
			{
				label: 'Validate bay 14 inventory',
				explanation: 'Run quick analytics to ensure yard and vessel views are back in sync.',
				cite: 'KB-2301',
				artifactType: 'sql',
				artifact:
					"SELECT cntr_no, status\nFROM vw_tranship_pipeline\nWHERE vessel_name = 'MV PACIFIC DAWN'\nAND status IN ('LOADED','ON_VESSEL');"
			},
			{
				label: 'Prepare escalation brief',
				explanation:
					'Coordinate with Vessel Operations lead to monitor impact across planning teams.',
				cite: 'KB-2301',
				artifactType: 'template',
				artifact:
					'Subject: Escalation - MV PACIFIC DAWN BAPLIE regression\nBody: Bay 14 load marked complete but stale BAPLIE reapplied. Replay triggered; monitoring sync.'
			}
		],
		escalation: {
			required: true,
			summary:
				'Coordinate with Jaden Smith (Vessel Operations) for cross-team visibility and confirm recovery tracking.',
			owner: 'Jaden Smith',
			team: 'Vessel Duty Team',
			channel: 'Teams Bridge',
			escalationNote:
				'Incident TCK-742311 describes BAPLIE regression for MV PACIFIC DAWN/07E. Escalate to vessel operations to monitor plan replay and yard alignment.'
		},
		ragExtract:
			'Incident TCK-742311 reports BAPLIE inconsistency for MV PACIFIC DAWN/07E. Logs show planning_sync warning that an older timestamp overwrote bay 14, and COARRI logs confirm bay 14 load completed earlier. Knowledge base KB-2301 instructs locking updates, replaying the latest interchange, validating bay inventory, and escalating to Vessel Duty Team lead Jaden Smith.'
	}
];

/**
 * @param {string} id
 * @returns {Incident | undefined}
 */
export function getIncidentById(id) {
	return incidents.find((incident) => incident.id === id);
}

export type PlaybookActionStep = {
	stepTitle: string;
	executionContext: string;
	procedure: string[];
	checklistItems?: string[];
};

export type PlaybookChecklist = {
	title: string;
	items: string[];
	relatedStep?: string;
};

export type EscalationContact = {
	name: string;
	email: string;
	role: string;
};

export type EscalationPlan = {
	category: string;
	categoryCode: string;
	likelihood: 'likely' | 'unlikely' | 'uncertain';
	summary: string;
	reasoning: string;
	recommendedSubject: string;
	recommendedMessage: string;
	primaryContact: EscalationContact;
	alternateContacts?: EscalationContact[];
};

export type PlaybookPayload = {
	importantSafetyNotes: string[];
	actionSteps: PlaybookActionStep[];
	verificationSteps: string[];
	checklists: PlaybookChecklist[];
	escalationPlan: EscalationPlan;
	aiDescription: string;
};

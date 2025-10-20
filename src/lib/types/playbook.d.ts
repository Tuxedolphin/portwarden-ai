export type PlaybookPayload = {
	importantSafetyNotes: string[];
	actionSteps: Array<{
		stepTitle: string;
		executionContext: string;
		procedure: string[];
	}>;
	verificationSteps: string[];
	checklists: Array<{ title: string; items: string[] }>;
};

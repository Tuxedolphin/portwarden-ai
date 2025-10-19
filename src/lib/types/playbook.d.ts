export type PlaybookPayload = {
	importantSafetyNotes: string[];
	actionSteps: Array<{
		stepTitle: string;
		executionContext: string;
		procedure: string[];
	}>;
		languageCommands: Array<{
			language: string;
			command: string;
		}>;
	checklists: Array<{ title: string; items: string[] }>;
};

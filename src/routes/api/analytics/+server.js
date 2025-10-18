import { json } from '@sveltejs/kit';
import { analyzeCasePatterns, findSimilarCases, loadCaseLog } from '$lib/data/caseLog.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const action = url.searchParams.get('action') || 'analytics';
		const query = url.searchParams.get('q');
		const limit = parseInt(url.searchParams.get('limit') || '10');

		switch (action) {
			case 'analytics':
				const analysis = analyzeCasePatterns();
				return json({ analysis });

			case 'similar':
				if (!query) {
					return json({ error: 'Query parameter required for similar cases' }, { status: 400 });
				}
				const similarCases = findSimilarCases(query, limit);
				return json({ cases: similarCases, query, count: similarCases.length });

			case 'all':
				const allCases = loadCaseLog();
				return json({ cases: allCases, count: allCases.length });

			default:
				return json({ error: 'Invalid action parameter' }, { status: 400 });
		}
	} catch (error) {
		console.error('Case analytics API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

import { json } from '@sveltejs/kit';
import {
	searchKnowledgeBase,
	getAllKnowledgeArticles,
	getKnowledgeArticle
} from '$lib/data/knowledgeBase.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const query = url.searchParams.get('q');
		const id = url.searchParams.get('id');
		const limit = parseInt(url.searchParams.get('limit') || '10');

		if (id) {
			// Get specific article by ID
			const article = getKnowledgeArticle(id);
			if (article) {
				return json({ article });
			} else {
				return json({ error: 'Article not found' }, { status: 404 });
			}
		} else if (query) {
			// Search articles
			const articles = searchKnowledgeBase(query, limit);
			return json({ articles, query, count: articles.length });
		} else {
			// Get all articles
			const articles = getAllKnowledgeArticles();
			return json({ articles, count: articles.length });
		}
	} catch (error) {
		console.error('Knowledge base API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

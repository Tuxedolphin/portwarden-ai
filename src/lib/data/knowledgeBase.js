/**
 * Knowledge Base Parser and Search Engine
 * Parses the provided Knowledge Base.md file and provides intelligent search capabilities
 */
import fs from 'fs';
import path from 'path';

/**
 * @typedef {Object} KnowledgeArticle
 * @property {string} id - Article ID (e.g., "CNTR-001")
 * @property {string} title - Article title
 * @property {string} module - Module (Container Report, Container Booking)
 * @property {string} overview - Problem overview
 * @property {string[]} resolutionSteps - Step-by-step resolution
 * @property {string[]} verificationSteps - Verification steps
 * @property {string[]} keywords - Extracted keywords for search
 */

/** @type {KnowledgeArticle[] | null} */
let knowledgeBaseCache = null;

/**
 * Parse the Knowledge Base markdown file
 * @returns {KnowledgeArticle[]}
 */
function parseKnowledgeBase() {
    if (knowledgeBaseCache) return knowledgeBaseCache;
    
    try {
        const kbPath = path.join(process.cwd(), 'provided', 'Knowledge Base.md');
        const content = fs.readFileSync(kbPath, 'utf-8');
        
        /** @type {KnowledgeArticle[]} */
        const articles = [];
        const sections = content.split(/(?=\*\*CNTR:)/);
        
        sections.forEach((section, index) => {
            if (!section.trim() || section.startsWith('Knowledge Base')) return;
            
            const lines = section.split('\n');
            const titleMatch = section.match(/\*\*CNTR: (.+?)\*\*/);
            const moduleMatch = section.match(/\| Module \| (.+?) \|/);
            
            if (!titleMatch) return;
            
            const title = titleMatch[1].trim();
            const module = moduleMatch ? moduleMatch[1].trim() : 'Unknown';
            
            // Extract overview
            const overviewStart = section.indexOf('**Overview**');
            const resolutionStart = section.indexOf('**Resolution**');
            const overview = overviewStart !== -1 && resolutionStart !== -1 
                ? section.substring(overviewStart + 12, resolutionStart).trim()
                : '';
            
            // Extract resolution steps
            const verificationStart = section.indexOf('**Verification**');
            const resolutionText = resolutionStart !== -1 && verificationStart !== -1
                ? section.substring(resolutionStart + 14, verificationStart).trim()
                : '';
            
            const resolutionSteps = resolutionText
                .split(/\n\d+\./)
                .filter(step => step.trim())
                .map(step => step.trim().replace(/^\d+\./, '').trim());
            
            // Extract verification steps
            const verificationText = verificationStart !== -1
                ? section.substring(verificationStart + 16).trim()
                : '';
            
            const verificationSteps = verificationText
                .split(/\n\d+\./)
                .filter(step => step.trim())
                .map(step => step.trim().replace(/^\d+\./, '').trim());
            
            // Generate keywords for search
            const keywords = extractKeywords(title + ' ' + overview + ' ' + resolutionText);
            
            articles.push({
                id: `CNTR-${String(index).padStart(3, '0')}`,
                title,
                module,
                overview,
                resolutionSteps,
                verificationSteps,
                keywords
            });
        });
        
        knowledgeBaseCache = articles;
        return articles;
    } catch (error) {
        console.error('Error parsing knowledge base:', error);
        return [];
    }
}

/**
 * Extract keywords from text for search indexing
 * @param {string} text 
 * @returns {string[]}
 */
function extractKeywords(text) {
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should']);
    
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word))
        .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
}

/**
 * Search knowledge base articles by keywords
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {KnowledgeArticle[]}
 */
export function searchKnowledgeBase(query, limit = 5) {
    const articles = parseKnowledgeBase();
    const queryKeywords = extractKeywords(query);
    
    if (queryKeywords.length === 0) return articles.slice(0, limit);
    
    const scored = articles.map(article => {
        let score = 0;
        
        queryKeywords.forEach(keyword => {
            // Higher weight for title matches
            if (article.title.toLowerCase().includes(keyword)) score += 3;
            if (article.overview.toLowerCase().includes(keyword)) score += 2;
            if (article.keywords.includes(keyword)) score += 1;
        });
        
        return { ...article, score };
    });
    
    return scored
        .filter(article => article.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Get knowledge base article by ID
 * @param {string} id - Article ID
 * @returns {KnowledgeArticle|null}
 */
export function getKnowledgeArticle(id) {
    const articles = parseKnowledgeBase();
    return articles.find(article => article.id === id) || null;
}

/**
 * Get all knowledge base articles
 * @returns {KnowledgeArticle[]}
 */
export function getAllKnowledgeArticles() {
    return parseKnowledgeBase();
}

/**
 * Generate AI context from relevant knowledge base articles
 * @param {string} incidentDescription - Description of the incident
 * @param {number} maxArticles - Maximum articles to include
 * @returns {string}
 */
export function generateAIContext(incidentDescription, maxArticles = 3) {
    const relevantArticles = searchKnowledgeBase(incidentDescription, maxArticles);
    
    if (relevantArticles.length === 0) {
        return "No directly relevant knowledge base articles found.";
    }
    
    let context = "Relevant Knowledge Base Articles:\n\n";
    
    relevantArticles.forEach((article, index) => {
        context += `${index + 1}. **${article.title}** (${article.id})\n`;
        context += `Module: ${article.module}\n`;
        context += `Overview: ${article.overview.substring(0, 200)}...\n`;
        context += `Key Resolution Steps:\n`;
        article.resolutionSteps.slice(0, 3).forEach((step, stepIndex) => {
            context += `   ${stepIndex + 1}. ${step.substring(0, 100)}...\n`;
        });
        context += '\n';
    });
    
    return context;
}
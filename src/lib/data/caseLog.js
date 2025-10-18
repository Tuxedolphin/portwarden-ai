/**
 * Case Log Parser and Analysis Engine
 * Processes historical case logs for AI training and pattern recognition
 */
import fs from 'fs';
import path from 'path';

/**
 * @typedef {Object} CaseLogEntry
 * @property {string} id - Case ID
 * @property {string} timestamp - When the case occurred
 * @property {string} severity - Case severity level
 * @property {string} module - Affected module
 * @property {string} description - Case description
 * @property {string[]} resolutionSteps - Steps taken to resolve
 * @property {number} resolutionTime - Time to resolution in minutes
 * @property {string[]} tags - Extracted tags for categorization
 */

/**
 * Load and parse case log data
 * @returns {CaseLogEntry[]}
 */
export function loadCaseLog() {
    try {
        const caselogPath = path.join(process.cwd(), 'provided', 'caselog.json');
        const content = fs.readFileSync(caselogPath, 'utf-8');
        const rawData = JSON.parse(content);
        
        // Parse the case log entries
        /** @type {CaseLogEntry[]} */
        const entries = [];
        
        if (Array.isArray(rawData)) {
            rawData.forEach((entry, index) => {
                entries.push({
                    id: entry.id || `CASE-${String(index).padStart(4, '0')}`,
                    timestamp: entry.timestamp || new Date().toISOString(),
                    severity: entry.severity || 'Medium',
                    module: entry.module || 'Unknown',
                    description: entry.description || '',
                    resolutionSteps: entry.resolutionSteps || [],
                    resolutionTime: entry.resolutionTime || 0,
                    tags: extractTags(entry.description || '')
                });
            });
        }
        
        return entries;
    } catch (error) {
        console.error('Error loading case log:', error);
        return [];
    }
}

/**
 * Extract tags from case description for categorization
 * @param {string} description 
 * @returns {string[]}
 */
function extractTags(description) {
    const tagPatterns = [
        /container/i,
        /vessel/i,
        /booking/i,
        /edi/i,
        /auth/i,
        /timeout/i,
        /error/i,
        /api/i,
        /database/i,
        /sync/i
    ];
    
    /** @type {string[]} */
    const tags = [];
    
    tagPatterns.forEach(pattern => {
        if (pattern.test(description)) {
            const match = description.match(pattern);
            if (match) {
                tags.push(match[0].toLowerCase());
            }
        }
    });
    
    return [...new Set(tags)]; // Remove duplicates
}

/**
 * Analyze case patterns for AI insights
 * @param {CaseLogEntry[] | null} cases 
 * @returns {{
 *   totalCases: number,
 *   severityDistribution: Record<string, number>,
 *   moduleDistribution: Record<string, number>,
 *   commonTags: Record<string, number>,
 *   averageResolutionTime: number,
 *   resolutionTimeByModule: Record<string, number>,
 *   monthlyTrends: Record<string, number>
 * }}
 */
export function analyzeCasePatterns(cases = null) {
    const caseLog = cases || loadCaseLog();
    
    const analysis = {
        totalCases: caseLog.length,
        /** @type {Record<string, number>} */
        severityDistribution: {},
        /** @type {Record<string, number>} */
        moduleDistribution: {},
        /** @type {Record<string, number>} */
        commonTags: {},
        averageResolutionTime: 0,
        /** @type {Record<string, number>} */
        resolutionTimeByModule: {},
        /** @type {Record<string, number>} */
        monthlyTrends: {}
    };
    
    let totalResolutionTime = 0;
    /** @type {Record<string, number[]>} */
    const moduleResolutionTimes = {};
    
    caseLog.forEach(case_ => {
        // Severity distribution
        analysis.severityDistribution[case_.severity] = 
            (analysis.severityDistribution[case_.severity] || 0) + 1;
        
        // Module distribution
        analysis.moduleDistribution[case_.module] = 
            (analysis.moduleDistribution[case_.module] || 0) + 1;
        
        // Common tags
        case_.tags.forEach(tag => {
            analysis.commonTags[tag] = (analysis.commonTags[tag] || 0) + 1;
        });
        
        // Resolution time analysis
        totalResolutionTime += case_.resolutionTime;
        
        if (!moduleResolutionTimes[case_.module]) {
            moduleResolutionTimes[case_.module] = [];
        }
        moduleResolutionTimes[case_.module].push(case_.resolutionTime);
        
        // Monthly trends
        const month = case_.timestamp.substring(0, 7); // YYYY-MM
        analysis.monthlyTrends[month] = (analysis.monthlyTrends[month] || 0) + 1;
    });
    
    analysis.averageResolutionTime = caseLog.length > 0 
        ? Math.round(totalResolutionTime / caseLog.length) 
        : 0;
    
    // Calculate average resolution time by module
    Object.keys(moduleResolutionTimes).forEach(module => {
        const times = moduleResolutionTimes[module];
        analysis.resolutionTimeByModule[module] = Math.round(
            times.reduce((/** @type {number} */ sum, /** @type {number} */ time) => sum + time, 0) / times.length
        );
    });
    
    return analysis;
}

/**
 * Find similar historical cases for AI context
 * @param {string} incidentDescription 
 * @param {number} limit 
 * @returns {CaseLogEntry[]}
 */
export function findSimilarCases(incidentDescription, limit = 5) {
    const caseLog = loadCaseLog();
    const queryWords = incidentDescription.toLowerCase().split(/\s+/);
    
    const scored = caseLog.map(case_ => {
        let score = 0;
        const caseText = (case_.description + ' ' + case_.tags.join(' ')).toLowerCase();
        
        queryWords.forEach(word => {
            if (caseText.includes(word)) {
                score += 1;
            }
        });
        
        return { ...case_, score };
    });
    
    return scored
        .filter(case_ => case_.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Generate AI training context from historical cases
 * @param {string} incidentType 
 * @returns {string}
 */
export function generateTrainingContext(incidentType) {
    const similarCases = findSimilarCases(incidentType, 3);
    const analysis = analyzeCasePatterns();
    
    let context = "Historical Case Analysis:\n\n";
    
    if (similarCases.length > 0) {
        context += "Similar Past Cases:\n";
        similarCases.forEach((case_, index) => {
            context += `${index + 1}. ${case_.id}: ${case_.description.substring(0, 100)}...\n`;
            context += `   Resolution Time: ${case_.resolutionTime}min, Severity: ${case_.severity}\n`;
            if (case_.resolutionSteps.length > 0) {
                context += `   Key Steps: ${case_.resolutionSteps[0].substring(0, 80)}...\n`;
            }
            context += '\n';
        });
    }
    
    context += `Pattern Analysis:\n`;
    context += `- Average Resolution Time: ${analysis.averageResolutionTime}min\n`;
    context += `- Most Common Tags: ${Object.entries(analysis.commonTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => `${tag}(${count})`)
        .join(', ')}\n`;
    
    return context;
}
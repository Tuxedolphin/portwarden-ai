import { loadCaseLog } from '$lib/data/caseLog.js';
import { getAllKnowledgeArticles } from '$lib/data/knowledgeBase.js';

/**
 * Analyze case patterns to generate response templates
 */
export function analyzeResponsePatterns() {
    const caseLog = loadCaseLog();
    
    const patterns = {
        /** @type {Record<string, any[]>} */
        byModule: {},
        /** @type {Record<string, any[]>} */
        byKeyword: {},
        /** @type {Record<string, any[]>} */
        timePatterns: {},
        /** @type {any[]} */
        successfulResolutions: []
    };

    caseLog.forEach(caseItem => {
        // Extract module from case description or tags
        const module = extractModule(caseItem);
        if (!module) return;

        if (!patterns.byModule[module]) {
            patterns.byModule[module] = [];
        }
        
        patterns.byModule[module].push({
            issue: caseItem.description,
            timing: caseItem.resolutionTime || 0,
            tags: caseItem.tags || []
        });

        // Extract common keywords for pattern matching
        const keywords = caseItem.description?.toLowerCase().split(/\s+/) || [];
        keywords.forEach(keyword => {
            if (keyword.length > 3) { // Skip short words
                if (!patterns.byKeyword[keyword]) {
                    patterns.byKeyword[keyword] = [];
                }
                patterns.byKeyword[keyword].push(caseItem);
            }
        });
    });

    return patterns;
}

/**
 * Extract module from case item (CNTR, EDI, VSL, AUTH, etc.)
 * @param {any} caseItem 
 * @returns {string|null}
 */
function extractModule(caseItem) {
    const description = (caseItem?.description || '').toLowerCase();
    
    if (description.includes('container') || description.includes('cntr')) return 'CNTR';
    if (description.includes('edi') || description.includes('edifact')) return 'EDI';
    if (description.includes('vessel') || description.includes('vsl')) return 'VSL';
    if (description.includes('auth') || description.includes('token')) return 'AUTH';
    if (description.includes('booking')) return 'BOOKING';
    
    return 'GENERAL';
}

/**
 * Generate response templates based on historical patterns
 */
export function generateResponseTemplates() {
    const patterns = analyzeResponsePatterns();
    
    const templates = {
        /** @type {Record<string, any>} */
        playbook: {},
        /** @type {Record<string, any>} */
        escalation: {}
    };

    // Generate playbook templates by module
    Object.entries(patterns.byModule).forEach(([module, cases]) => {
        templates.playbook[module] = {
            commonSteps: extractCommonSteps(cases),
            avgResolutionTime: calculateAverageTime(cases),
            successRate: calculateSuccessRate(cases),
            template: generatePlaybookTemplate(module, cases)
        };
        
        templates.escalation[module] = {
            escalationTriggers: extractEscalationTriggers(cases),
            urgencyIndicators: extractUrgencyPatterns(cases),
            template: generateEscalationTemplate(module, cases)
        };
    });

    return templates;
}

/**
 * Extract common resolution steps from cases
 * @param {any[]} cases 
 * @returns {string[]}
 */
function extractCommonSteps(cases) {
    /** @type {string[]} */
    const stepPatterns = [];
    cases.forEach(caseItem => {
        // Extract common patterns from resolution steps
        if (caseItem.resolutionSteps && Array.isArray(caseItem.resolutionSteps)) {
            stepPatterns.push(...caseItem.resolutionSteps);
        }
    });
    
    // Return most common steps (simplified)
    return [...new Set(stepPatterns)].slice(0, 5);
}

/**
 * Calculate average resolution time
 * @param {any[]} cases 
 * @returns {number}
 */
function calculateAverageTime(cases) {
    const times = cases.filter(c => c.timing > 0).map(c => c.timing);
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 30;
}

/**
 * Calculate success rate (simplified)
 * @param {any[]} cases 
 * @returns {number}
 */
function calculateSuccessRate(cases) {
    // For now, assume 85% success rate as we don't have this data
    return 85;
}

/**
 * Extract escalation triggers
 * @param {any[]} cases 
 * @returns {string[]}
 */
function extractEscalationTriggers(cases) {
    return [
        'Resolution time > 2 hours',
        'Multiple system impact',
        'Customer-facing service down'
    ];
}

/**
 * Extract urgency patterns
 * @param {any[]} cases 
 * @returns {string[]}
 */
function extractUrgencyPatterns(cases) {
    return [
        'Critical severity incidents',
        'Port operations disruption',
        'Revenue impact scenarios'
    ];
}

/**
 * Generate playbook template for a module
 * @param {string} module 
 * @param {any[]} cases 
 * @returns {string}
 */
function generatePlaybookTemplate(module, cases) {
    return `
## ${module} Incident Playbook

### Prerequisites
- [ ] Verify system access and permissions
- [ ] Check recent deployment history
- [ ] Review monitoring dashboards

### Investigation Steps
1. **Initial Assessment**
   - Gather incident details and scope
   - Check system health indicators
   - Review recent changes

2. **Root Cause Analysis**
   - ${getModuleSpecificSteps(module, cases)}
   - Cross-reference with knowledge base articles
   - Check for similar historical patterns

3. **Resolution**
   - Apply appropriate fix based on root cause
   - Monitor for immediate improvement
   - Document resolution steps

### Verification Checklist
- [ ] Primary issue resolved
- [ ] No secondary impacts identified  
- [ ] Monitoring shows green status
- [ ] Stakeholders notified

### Ready to Close
- [ ] Resolution verified by affected teams
- [ ] Post-incident review scheduled if needed
- [ ] Knowledge base updated if new pattern identified
    `.trim();
}

/**
 * Generate escalation template for a module
 * @param {string} module 
 * @param {any[]} cases 
 * @returns {string}
 */
function generateEscalationTemplate(module, cases) {
    return `
## ${module} Escalation Summary

**Incident Snapshot:** Brief description of the issue and impact
**Current Mitigation:** Steps already taken to address the problem
**Outstanding Risks:** Potential consequences if not resolved quickly
**Explicit Ask:** Specific resources or decisions needed from leadership
**Next Check-in:** Recommended follow-up time
    `.trim();
}

/**
 * Get module-specific investigation steps
 * @param {string} module 
 * @param {any[]} cases 
 * @returns {string}
 */
function getModuleSpecificSteps(module, cases) {
    /** @type {Record<string, string>} */
    const moduleSteps = {
        'EDI': '- Check message queue status\n   - Verify partner connectivity\n   - Review translation logs',
        'VSL': '- Validate vessel schedule data\n   - Check ETA/ETB calculations\n   - Verify port allocation',
        'CNTR': '- Review container status discrepancies\n   - Check TOS synchronization\n   - Validate portal data consistency',
        'AUTH': '- Verify token validation logic\n   - Check authentication service health\n   - Review session management',
        'BOOKING': '- Validate booking data integrity\n   - Check customer portal sync\n   - Review reservation conflicts'
    };
    return moduleSteps[module] || '- Module-specific investigation steps';
}
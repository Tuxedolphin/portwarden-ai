/**
 * Validation Framework for AI Responses
 * 
 * Tests AI responses against real operational procedures to ensure accuracy
 * and compliance with maritime operational standards.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class ValidationFramework {
    constructor() {
        this.dataDir = join(process.cwd(), '.auth-data');
        this.validationFile = join(this.dataDir, 'validation-results.json');
        this.testSuitesFile = join(this.dataDir, 'test-suites.json');
        
        this.initializeValidation();
    }

    /**
     * Initialize validation tracking files
     */
    initializeValidation() {
        if (!existsSync(this.dataDir)) {
            mkdirSync(this.dataDir, { recursive: true });
        }

        if (!existsSync(this.validationFile)) {
            this.saveValidationResults({
                results: {},
                summary: {
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 0,
                    avgAccuracy: 0,
                    lastRun: new Date().toISOString()
                }
            });
        }

        if (!existsSync(this.testSuitesFile)) {
            this.saveTestSuites(this.getDefaultTestSuites());
        }
    }

    /**
     * Validate an AI response against operational procedures
     * @param {string} query - Original user query
     * @param {string} aiResponse - AI's response
     * @param {string} module - Module being tested (EDI, VSL, CNTR, etc.)
     * @param {string|null} expectedOutcome - Expected result if known
     * @returns {Promise<any>} Validation result
     */
    async validateResponse(query, aiResponse, module = 'GENERAL', expectedOutcome = null) {
        const testId = this.generateTestId(query, module);
        const timestamp = new Date().toISOString();

        /** @type {any} */
        const validation = {
            testId,
            timestamp,
            query,
            aiResponse,
            module,
            expectedOutcome,
            results: {},
            overallScore: 0,
            passed: false
        };

        // Run validation tests
        validation.results.procedureCompliance = this.validateProcedureCompliance(aiResponse, module);
        validation.results.accuracyCheck = this.validateAccuracy(aiResponse, query, module);
        validation.results.safetyValidation = this.validateSafety(aiResponse, module);
        validation.results.completenessCheck = this.validateCompleteness(aiResponse, query);
        validation.results.clarityScore = this.validateClarity(aiResponse);

        // Calculate overall score
        const scores = Object.values(validation.results).map((/** @type {any} */ r) => r.score || 0);
        validation.overallScore = Math.round(scores.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0) / scores.length);
        validation.passed = validation.overallScore >= 70; // 70% threshold

        // Save results
        this.saveValidationResult(validation);

        return validation;
    }

    /**
     * Validate that response follows proper operational procedures
     * @param {string} response 
     * @param {string} module 
     * @returns {any}
     */
    validateProcedureCompliance(response, module) {
        const procedures = this.getModuleProcedures(module);
        let score = 100;
        /** @type {string[]} */
        const issues = [];

        // Check for required procedure steps
        procedures.requiredSteps.forEach((/** @type {string} */ step) => {
            if (!response.toLowerCase().includes(step.toLowerCase())) {
                score -= 10;
                issues.push(`Missing required step: ${step}`);
            }
        });

        // Check for prohibited actions
        procedures.prohibitedActions.forEach((/** @type {string} */ action) => {
            if (response.toLowerCase().includes(action.toLowerCase())) {
                score -= 20;
                issues.push(`Contains prohibited action: ${action}`);
            }
        });

        return {
            score: Math.max(0, score),
            issues,
            category: 'procedure_compliance'
        };
    }

    /**
     * Validate technical accuracy of the response
     * @param {string} response 
     * @param {string} query 
     * @param {string} module 
     * @returns {any}
     */
    validateAccuracy(response, query, module) {
        let score = 100;
        /** @type {string[]} */
        const issues = [];

        // Check for module-specific accuracy patterns
        const patterns = this.getAccuracyPatterns(module);
        
        patterns.forEach((/** @type {any} */ pattern) => {
            if (pattern.required && !new RegExp(pattern.regex, 'i').test(response)) {
                score -= pattern.penalty || 15;
                issues.push(`Missing ${pattern.description}`);
            }
        });

        // Check for common technical errors
        const techErrors = this.checkTechnicalErrors(response, module);
        if (techErrors.length > 0) {
            score -= techErrors.length * 10;
            issues.push(...techErrors);
        }

        return {
            score: Math.max(0, score),
            issues,
            category: 'accuracy'
        };
    }

    /**
     * Validate safety considerations in the response
     * @param {string} response 
     * @param {string} module 
     * @returns {any}
     */
    validateSafety(response, module) {
        let score = 100;
        /** @type {string[]} */
        const issues = [];

        const safetyChecks = this.getSafetyChecks(module);
        
        safetyChecks.forEach((/** @type {any} */ check) => {
            if (check.mustInclude && !response.toLowerCase().includes(check.keyword.toLowerCase())) {
                score -= 25; // Safety issues are heavily penalized
                issues.push(`Missing safety consideration: ${check.description}`);
            }
        });

        // Check for unsafe recommendations
        const unsafeTerms = ['bypass', 'skip verification', 'ignore warning', 'override safety'];
        unsafeTerms.forEach(term => {
            if (response.toLowerCase().includes(term)) {
                score -= 30;
                issues.push(`Contains potentially unsafe recommendation: ${term}`);
            }
        });

        return {
            score: Math.max(0, score),
            issues,
            category: 'safety'
        };
    }

    /**
     * Validate completeness of the response
     * @param {string} response 
     * @param {string} query 
     * @returns {any}
     */
    validateCompleteness(response, query) {
        let score = 100;
        /** @type {string[]} */
        const issues = [];

        // Check response length appropriateness
        if (response.length < 100) {
            score -= 20;
            issues.push('Response may be too brief for complex query');
        }

        // Check for actionable steps
        const hasActionableSteps = /\d+\.|step|first|then|next|finally/i.test(response);
        if (!hasActionableSteps && query.toLowerCase().includes('how')) {
            score -= 15;
            issues.push('Missing clear actionable steps for "how" query');
        }

        // Check for verification steps
        if (query.toLowerCase().includes('troubleshoot') || query.toLowerCase().includes('fix')) {
            if (!response.toLowerCase().includes('verify') && !response.toLowerCase().includes('confirm')) {
                score -= 10;
                issues.push('Missing verification steps for troubleshooting query');
            }
        }

        return {
            score: Math.max(0, score),
            issues,
            category: 'completeness'
        };
    }

    /**
     * Validate clarity and understandability of response
     * @param {string} response 
     * @returns {any}
     */
    validateClarity(response) {
        let score = 100;
        /** @type {string[]} */
        const issues = [];

        // Check for clear structure
        const hasStructure = /##|###|\*\*|1\.|2\.|step/i.test(response);
        if (!hasStructure && response.length > 200) {
            score -= 15;
            issues.push('Long response lacks clear structure or formatting');
        }

        // Check for technical jargon without explanation
        const jargonTerms = ['EDI', 'ETA', 'ETB', 'TOS', 'BL', 'SOC', 'COC'];
        const jargonCount = jargonTerms.filter(term => response.includes(term)).length;
        if (jargonCount > 2) {
            score -= 10;
            issues.push('May contain too much technical jargon without explanation');
        }

        return {
            score: Math.max(0, score),
            issues,
            category: 'clarity'
        };
    }

    /**
     * Run automated test suite
     * @param {string} module - Module to test
     * @returns {Promise<any>} Test results
     */
    async runTestSuite(module = 'ALL') {
        const testSuites = this.loadTestSuites();
        /** @type {any} */
        const results = {
            timestamp: new Date().toISOString(),
            module,
            tests: [],
            summary: {}
        };

        const suitesToRun = module === 'ALL' ? 
            Object.keys(testSuites) : 
            [module].filter(m => testSuites[m]);

        for (const suiteModule of suitesToRun) {
            const suite = testSuites[suiteModule];
            for (const test of suite.tests) {
                // Simulate AI response for testing
                const mockResponse = this.generateMockResponse(test.query, suiteModule);
                const validation = await this.validateResponse(
                    test.query, 
                    mockResponse, 
                    suiteModule, 
                    test.expectedOutcome
                );
                
                results.tests.push({
                    ...validation,
                    testName: test.name,
                    category: test.category
                });
            }
        }

        // Calculate summary
        results.summary = {
            totalTests: results.tests.length,
            passed: results.tests.filter((/** @type {any} */ t) => t.passed).length,
            failed: results.tests.filter((/** @type {any} */ t) => !t.passed).length,
            avgScore: Math.round(
                results.tests.reduce((/** @type {number} */ sum, /** @type {any} */ t) => sum + t.overallScore, 0) / results.tests.length
            )
        };

        return results;
    }

    /**
     * Get module-specific procedure requirements
     * @param {string} module 
     * @returns {any}
     */
    getModuleProcedures(module) {
        /** @type {Record<string, any>} */
        const procedures = {
            'EDI': {
                requiredSteps: ['verify message format', 'check partner connectivity', 'validate mapping'],
                prohibitedActions: ['manual data entry', 'skip validation']
            },
            'VSL': {
                requiredSteps: ['check vessel schedule', 'verify berth allocation', 'confirm ETA'],
                prohibitedActions: ['override safety checks', 'bypass port authority']
            },
            'CNTR': {
                requiredSteps: ['validate container status', 'check location data', 'verify ownership'],
                prohibitedActions: ['release without documentation', 'override yard management']
            },
            'AUTH': {
                requiredSteps: ['verify credentials', 'check permissions', 'log access'],
                prohibitedActions: ['share credentials', 'bypass authentication']
            },
            'GENERAL': {
                requiredSteps: ['assess situation', 'follow protocol'],
                prohibitedActions: ['ignore safety', 'skip documentation']
            }
        };

        return procedures[module] || procedures['GENERAL'];
    }

    /**
     * Get accuracy validation patterns for a module
     * @param {string} module 
     * @returns {any[]}
     */
    getAccuracyPatterns(module) {
        /** @type {Record<string, any[]>} */
        const patterns = {
            'EDI': [
                { regex: 'message.*queue|queue.*status', required: true, description: 'message queue reference', penalty: 15 },
                { regex: 'partner|connectivity', required: true, description: 'partner connectivity check', penalty: 10 }
            ],
            'VSL': [
                { regex: 'ETA|ETB|schedule', required: true, description: 'vessel timing reference', penalty: 15 },
                { regex: 'berth|allocation', required: true, description: 'berth allocation check', penalty: 10 }
            ],
            'CNTR': [
                { regex: 'container.*status|status.*container', required: true, description: 'container status check', penalty: 15 },
                { regex: 'TOS|yard', required: false, description: 'TOS system reference', penalty: 5 }
            ],
            'GENERAL': []
        };

        return patterns[module] || [];
    }

    /**
     * Get safety checks for a module
     * @param {string} module 
     * @returns {any[]}
     */
    getSafetyChecks(module) {
        /** @type {Record<string, any[]>} */
        const checks = {
            'VSL': [
                { keyword: 'safety', mustInclude: true, description: 'vessel safety protocols' },
                { keyword: 'clearance', mustInclude: true, description: 'port clearance procedures' }
            ],
            'CNTR': [
                { keyword: 'documentation', mustInclude: true, description: 'proper documentation' },
                { keyword: 'verify', mustInclude: true, description: 'verification steps' }
            ],
            'AUTH': [
                { keyword: 'secure', mustInclude: true, description: 'security considerations' },
                { keyword: 'permission', mustInclude: true, description: 'permission validation' }
            ],
            'GENERAL': [
                { keyword: 'verify', mustInclude: false, description: 'verification step' }
            ]
        };

        return checks[module] || checks['GENERAL'];
    }

    /**
     * Check for common technical errors
     * @param {string} response 
     * @param {string} module 
     * @returns {string[]}
     */
    checkTechnicalErrors(response, module) {
        const errors = [];

        // Check for contradictory statements
        if (response.includes('always') && response.includes('never')) {
            errors.push('Contains contradictory absolute statements');
        }

        // Check for incomplete procedures
        if (response.includes('Step 1') && !response.includes('Step 2')) {
            errors.push('Incomplete step sequence');
        }

        return errors;
    }

    /**
     * Generate a test ID for tracking
     * @param {string} query 
     * @param {string} module 
     * @returns {string}
     */
    generateTestId(query, module) {
        const hash = query.split('').reduce((/** @type {number} */ a, /** @type {string} */ b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return `${module}_${Math.abs(hash)}_${Date.now()}`;
    }

    /**
     * Generate mock response for testing (simplified)
     * @param {string} query 
     * @param {string} module 
     * @returns {string}
     */
    generateMockResponse(query, module) {
        // This would normally call your AI, but for testing we'll return a mock
        return `Mock response for ${query} in ${module} module. This includes verification steps and follows proper procedures.`;
    }

    /**
     * Get default test suites
     * @returns {any}
     */
    getDefaultTestSuites() {
        return {
            'EDI': {
                tests: [
                    {
                        name: 'EDI Message Queue Status',
                        query: 'How do I check the EDI message queue status?',
                        category: 'procedure',
                        expectedOutcome: 'Clear steps to check queue with proper verification'
                    },
                    {
                        name: 'Partner Connectivity Issues',
                        query: 'EDI partner is not responding, what should I do?',
                        category: 'troubleshooting',
                        expectedOutcome: 'Diagnostic steps with escalation path'
                    }
                ]
            },
            'VSL': {
                tests: [
                    {
                        name: 'Vessel Schedule Validation',
                        query: 'How do I validate vessel schedule data?',
                        category: 'procedure',
                        expectedOutcome: 'Step-by-step validation with safety checks'
                    }
                ]
            }
        };
    }

    /**
     * Save validation result to file
     * @param {any} validation 
     */
    saveValidationResult(validation) {
        const results = this.loadValidationResults();
        results.results[validation.testId] = validation;
        
        // Update summary
        const allResults = Object.values(results.results);
        results.summary.totalTests = allResults.length;
        results.summary.passedTests = allResults.filter((/** @type {any} */ r) => r.passed).length;
        results.summary.failedTests = allResults.filter((/** @type {any} */ r) => !r.passed).length;
        results.summary.avgAccuracy = Math.round(
            allResults.reduce((/** @type {number} */ sum, /** @type {any} */ r) => sum + r.overallScore, 0) / allResults.length
        );
        results.summary.lastRun = new Date().toISOString();

        this.saveValidationResults(results);
    }

    /**
     * Load validation results from file
     * @returns {any}
     */
    loadValidationResults() {
        try {
            return JSON.parse(readFileSync(this.validationFile, 'utf8'));
        } catch (error) {
            console.error('Error loading validation results:', error);
            return { results: {}, summary: {} };
        }
    }

    /**
     * Save validation results to file
     * @param {any} results 
     */
    saveValidationResults(results) {
        try {
            writeFileSync(this.validationFile, JSON.stringify(results, null, 2));
        } catch (error) {
            console.error('Error saving validation results:', error);
        }
    }

    /**
     * Load test suites from file
     * @returns {any}
     */
    loadTestSuites() {
        try {
            return JSON.parse(readFileSync(this.testSuitesFile, 'utf8'));
        } catch (error) {
            console.error('Error loading test suites:', error);
            return {};
        }
    }

    /**
     * Save test suites to file
     * @param {any} suites 
     */
    saveTestSuites(suites) {
        try {
            writeFileSync(this.testSuitesFile, JSON.stringify(suites, null, 2));
        } catch (error) {
            console.error('Error saving test suites:', error);
        }
    }
}
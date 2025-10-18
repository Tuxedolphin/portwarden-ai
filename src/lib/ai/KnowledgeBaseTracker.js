/**
 * Knowledge Base Tracker
 * 
 * Tracks article usage, effectiveness, and correlates with incident resolution success.
 * Part of the AI enhancement system to improve knowledge base quality and AI responses.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class KnowledgeBaseTracker {
    constructor() {
        this.dataDir = join(process.cwd(), '.auth-data');
        this.metricsFile = join(this.dataDir, 'kb-metrics.json');
        this.usageFile = join(this.dataDir, 'kb-usage.json');
        
        this.initializeTracking();
    }

    /**
     * Initialize tracking files if they don't exist
     */
    initializeTracking() {
        if (!existsSync(this.dataDir)) {
            mkdirSync(this.dataDir, { recursive: true });
        }

        if (!existsSync(this.metricsFile)) {
            this.saveMetrics({
                articles: {},
                summary: {
                    totalArticles: 0,
                    totalUsage: 0,
                    avgEffectiveness: 0,
                    lastUpdated: new Date().toISOString()
                }
            });
        }

        if (!existsSync(this.usageFile)) {
            this.saveUsage({
                sessions: [],
                dailyStats: {},
                lastReset: new Date().toISOString()
            });
        }
    }

    /**
     * Track when an article is accessed
     * @param {string} articleTitle 
     * @param {string} context - What triggered the article access
     * @param {string|null} sessionId - Current session ID
     */
    trackArticleAccess(articleTitle, context = 'search', sessionId = null) {
        const timestamp = new Date().toISOString();
        const today = timestamp.split('T')[0];

        // Update metrics
        const metrics = this.loadMetrics();
        if (!metrics.articles[articleTitle]) {
            metrics.articles[articleTitle] = {
                title: articleTitle,
                accessCount: 0,
                contexts: {},
                effectiveness: 0,
                resolutionCorrelation: [],
                firstAccessed: timestamp,
                lastAccessed: timestamp
            };
        }

        metrics.articles[articleTitle].accessCount++;
        metrics.articles[articleTitle].lastAccessed = timestamp;
        metrics.articles[articleTitle].contexts[context] = 
            (metrics.articles[articleTitle].contexts[context] || 0) + 1;

        metrics.summary.totalUsage++;
        metrics.summary.lastUpdated = timestamp;

        this.saveMetrics(metrics);

        // Update usage logs
        const usage = this.loadUsage();
        usage.sessions.push({
            timestamp,
            articleTitle,
            context,
            sessionId,
            day: today
        });

        // Update daily stats
        if (!usage.dailyStats[today]) {
            usage.dailyStats[today] = {
                articles: {},
                totalAccess: 0,
                uniqueArticles: 0
            };
        }

        usage.dailyStats[today].totalAccess++;
        if (!usage.dailyStats[today].articles[articleTitle]) {
            usage.dailyStats[today].articles[articleTitle] = 0;
            usage.dailyStats[today].uniqueArticles++;
        }
        usage.dailyStats[today].articles[articleTitle]++;

        // Keep only last 30 days of sessions
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        usage.sessions = usage.sessions.filter((/** @type {any} */ session) => 
            new Date(session.timestamp) > thirtyDaysAgo
        );

        this.saveUsage(usage);
    }

    /**
     * Track resolution success when article was involved
     * @param {string} articleTitle 
     * @param {boolean} wasSuccessful 
     * @param {number} resolutionTimeMinutes 
     * @param {string|null} feedback - Optional feedback about helpfulness
     */
    trackResolutionOutcome(articleTitle, wasSuccessful, resolutionTimeMinutes, feedback = null) {
        const metrics = this.loadMetrics();
        
        if (metrics.articles[articleTitle]) {
            metrics.articles[articleTitle].resolutionCorrelation.push({
                timestamp: new Date().toISOString(),
                successful: wasSuccessful,
                resolutionTime: resolutionTimeMinutes,
                feedback
            });

            // Recalculate effectiveness (rolling average of last 10 correlations)
            const recent = metrics.articles[articleTitle].resolutionCorrelation.slice(-10);
            const successRate = recent.filter((/** @type {any} */ r) => r.successful).length / recent.length;
            const avgTime = recent.reduce((/** @type {number} */ sum, /** @type {any} */ r) => sum + r.resolutionTime, 0) / recent.length;
            
            // Effectiveness score: success rate weighted by resolution speed
            metrics.articles[articleTitle].effectiveness = Math.round(
                (successRate * 70) + ((120 - Math.min(avgTime, 120)) / 120 * 30)
            );

            this.saveMetrics(metrics);
        }
    }

    /**
     * Get most effective articles for a given context
     * @param {string|null} context - 'incident', 'troubleshooting', 'configuration', etc.
     * @param {number} limit - Number of articles to return
     * @returns {any[]} Array of effective articles
     */
    getMostEffectiveArticles(context = null, limit = 5) {
        const metrics = this.loadMetrics();
        
        let articles = Object.values(metrics.articles);
        
        // Filter by context if specified
        if (context) {
            articles = articles.filter(article => 
                article.contexts[context] && article.contexts[context] > 0
            );
        }

        // Sort by effectiveness score
        articles.sort((a, b) => b.effectiveness - a.effectiveness);
        
        return articles.slice(0, limit).map(article => ({
            title: article.title,
            effectiveness: article.effectiveness,
            accessCount: article.accessCount,
            successRate: this.calculateSuccessRate(article),
            avgResolutionTime: this.calculateAvgResolutionTime(article)
        }));
    }

    /**
     * Get articles that might need updating based on poor performance
     * @returns {any[]} Articles with low effectiveness scores
     */
    getArticlesNeedingReview() {
        const metrics = this.loadMetrics();
        
        return Object.values(metrics.articles)
            .filter(article => 
                article.accessCount >= 3 && // Only consider articles used at least 3 times
                article.effectiveness < 50    // Low effectiveness threshold
            )
            .sort((a, b) => a.effectiveness - b.effectiveness)
            .map(article => ({
                title: article.title,
                effectiveness: article.effectiveness,
                accessCount: article.accessCount,
                successRate: this.calculateSuccessRate(article),
                issues: this.identifyArticleIssues(article)
            }));
    }

    /**
     * Get usage analytics for reporting
     * @param {number} days - Number of days to analyze
     * @returns {any} Usage analytics
     */
    getUsageAnalytics(days = 7) {
        const usage = this.loadUsage();
        const metrics = this.loadMetrics();
        
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        const recentSessions = usage.sessions.filter((/** @type {any} */ session) => 
            new Date(session.timestamp) > cutoff
        );

        /** @type {Record<string, number>} */
        const topArticles = {};
        /** @type {Record<string, number>} */
        const contextBreakdown = {};
        
        recentSessions.forEach((/** @type {any} */ session) => {
            topArticles[session.articleTitle] = (topArticles[session.articleTitle] || 0) + 1;
            contextBreakdown[session.context] = (contextBreakdown[session.context] || 0) + 1;
        });

        return {
            period: `${days} days`,
            totalAccess: recentSessions.length,
            uniqueArticles: Object.keys(topArticles).length,
            topArticles: Object.entries(topArticles)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([title, count]) => ({ title, count })),
            contextBreakdown,
            effectiveness: {
                high: Object.values(metrics.articles).filter(a => a.effectiveness >= 70).length,
                medium: Object.values(metrics.articles).filter(a => a.effectiveness >= 40 && a.effectiveness < 70).length,
                low: Object.values(metrics.articles).filter(a => a.effectiveness < 40).length
            }
        };
    }

    /**
     * Generate recommendations for knowledge base improvement
     * @returns {any} Improvement recommendations
     */
    generateRecommendations() {
        const metrics = this.loadMetrics();
        const usage = this.loadUsage();
        
        const recommendations = [];
        
        // Find gaps - frequently accessed but low effectiveness
        const problematicArticles = Object.values(metrics.articles)
            .filter(article => article.accessCount >= 5 && article.effectiveness < 60);
        
        if (problematicArticles.length > 0) {
            recommendations.push({
                type: 'update_articles',
                priority: 'high',
                description: `${problematicArticles.length} frequently accessed articles have low effectiveness`,
                articles: problematicArticles.map(a => a.title)
            });
        }

        // Find popular search contexts without good articles
        /** @type {Record<string, number>} */
        const contexts = {};
        usage.sessions.forEach((/** @type {any} */ session) => {
            contexts[session.context] = (contexts[session.context] || 0) + 1;
        });

        const topContexts = Object.entries(contexts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        topContexts.forEach(([context, count]) => {
            const effective = this.getMostEffectiveArticles(context, 1);
            if (effective.length === 0 || effective[0].effectiveness < 70) {
                recommendations.push({
                    type: 'create_article',
                    priority: 'medium',
                    description: `High demand for ${context} content but no highly effective articles`,
                    context,
                    searchCount: count
                });
            }
        });

        return recommendations;
    }

    /**
     * Calculate success rate for an article
     * @param {any} article 
     * @returns {number}
     */
    calculateSuccessRate(article) {
        if (!article.resolutionCorrelation || article.resolutionCorrelation.length === 0) {
            return 0;
        }
        
        const successful = article.resolutionCorrelation.filter((/** @type {any} */ r) => r.successful).length;
        return Math.round((successful / article.resolutionCorrelation.length) * 100);
    }

    /**
     * Calculate average resolution time for an article
     * @param {any} article 
     * @returns {number}
     */
    calculateAvgResolutionTime(article) {
        if (!article.resolutionCorrelation || article.resolutionCorrelation.length === 0) {
            return 0;
        }
        
        const times = article.resolutionCorrelation.map((/** @type {any} */ r) => r.resolutionTime);
        return Math.round(times.reduce((/** @type {number} */ sum, /** @type {number} */ time) => sum + time, 0) / times.length);
    }

    /**
     * Identify specific issues with an article
     * @param {any} article 
     * @returns {string[]}
     */
    identifyArticleIssues(article) {
        const issues = [];
        
        if (this.calculateSuccessRate(article) < 60) {
            issues.push('Low resolution success rate');
        }
        
        if (this.calculateAvgResolutionTime(article) > 90) {
            issues.push('Long average resolution time');
        }
        
        if (article.resolutionCorrelation.some((/** @type {any} */ r) => r.feedback && r.feedback.includes('outdated'))) {
            issues.push('Feedback indicates outdated information');
        }
        
        return issues;
    }

    /**
     * Load metrics from file
     * @returns {any}
     */
    loadMetrics() {
        try {
            return JSON.parse(readFileSync(this.metricsFile, 'utf8'));
        } catch (error) {
            console.error('Error loading metrics:', error);
            return { articles: {}, summary: {} };
        }
    }

    /**
     * Save metrics to file
     * @param {any} metrics 
     */
    saveMetrics(metrics) {
        try {
            writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
        } catch (error) {
            console.error('Error saving metrics:', error);
        }
    }

    /**
     * Load usage from file
     * @returns {any}
     */
    loadUsage() {
        try {
            return JSON.parse(readFileSync(this.usageFile, 'utf8'));
        } catch (error) {
            console.error('Error loading usage:', error);
            return { sessions: [], dailyStats: {} };
        }
    }

    /**
     * Save usage to file
     * @param {any} usage 
     */
    saveUsage(usage) {
        try {
            writeFileSync(this.usageFile, JSON.stringify(usage, null, 2));
        } catch (error) {
            console.error('Error saving usage:', error);
        }
    }
}
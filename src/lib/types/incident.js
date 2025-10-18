/**
 * @typedef {'open' | 'in-progress' | 'resolved'} IncidentStatus
 */

/**
 * Lightweight incident shape used across the incidents dashboard.
 * @typedef {Object} IncidentSummary
 * @property {string | number} id
 * @property {string} title
 * @property {string} description
 * @property {IncidentStatus} status
 * @property {string} created_at
 * @property {string[]} tags
 */

export {}; // Ensures this file is treated as a module.

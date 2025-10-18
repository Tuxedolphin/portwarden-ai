/** @type {Record<string, string>} */
const severityPalette = {
	Critical: 'critical',
	High: 'high',
	Medium: 'medium',
	Low: 'low'
};

/**
 * @param {string | undefined | null} severity
 * @returns {string}
 */
export function toSeverityClass(severity) {
	if (!severity) return 'medium';
	return severityPalette[severity] ?? 'medium';
}

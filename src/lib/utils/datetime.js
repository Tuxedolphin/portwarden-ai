/**
 * @param {string | number | Date | null | undefined} value
 * @param {string} [locale]
 */
export function formatTimestamp(value, locale = 'en-US') {
	if (!value) return 'n/a';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return String(value);

	return date.toLocaleString(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'UTC'
	});
}

/**
 * @param {string | number | Date | null | undefined} value
 * @param {string | undefined} [locale]
 */
export function formatDate(value, locale = undefined) {
	if (!value) return 'Unknown';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Unknown';

	return date.toLocaleDateString(locale, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

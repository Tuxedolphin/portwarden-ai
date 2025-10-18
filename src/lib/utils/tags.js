/**
 * Convert a comma-delimited tag string into a clean array of tags.
 * @param {string} value
 * @returns {string[]}
 */
export function parseTags(value) {
	return value
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

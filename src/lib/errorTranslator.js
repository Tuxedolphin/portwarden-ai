// Lightweight error translator to present friendlier messages and paginated details
const DEFAULT = {
	title: 'Something went wrong',
	message:
		'An unexpected error occurred. You can retry the action or view the technical details for more information. If the problem persists, contact support with the error code or details.',
	code: 'UNKNOWN'
};

const MAPPINGS = {
	400: {
		title: 'Invalid request',
		message: 'The request sent to the server was malformed or missing required information.',
		steps: ['Verify the input fields and try again.']
	},
	401: {
		title: 'Authentication required',
		message: 'You are not authenticated. Please sign in and try again.',
		steps: ['Sign out and sign back in.', 'Check that your API key (server) is configured.']
	},
	403: {
		title: 'Permission denied',
		message: "You don't have permission to perform this action.",
		steps: ['Confirm your account has the required permissions.']
	},
	404: {
		title: 'Not found',
		message: 'The requested resource could not be found.',
		steps: ['Confirm the resource you requested exists and try again.']
	},
	502: {
		title: 'Upstream service error',
		message: 'An upstream service returned an invalid response.',
		steps: ['Retry after a short wait.', 'If the issue persists, check upstream service status.']
	},
	500: {
		title: 'Server error',
		message: 'The server encountered an internal error while processing the request.',
		steps: [
			'Retry the operation.',
			'If this keeps happening, capture the details and contact support.'
		]
	}
};

function splitIntoPages(text = '', maxChars = 1000) {
	if (!text) return [];
	const pages = [];
	for (let i = 0; i < text.length; i += maxChars) pages.push(text.slice(i, i + maxChars));
	return pages;
}

/** @param {any} obj */
function safeStringify(obj) {
	try {
		return JSON.stringify(obj, null, 2);
	} catch (e) {
		return String(obj);
	}
}

/**
 * Normalize different error shapes into a friendly structure the UI can render.
 * Accepts Error objects, fetch response shapes, or plain objects.
 */
/** @param {any} err */
export function translateError(err) {
	if (!err) return { ...DEFAULT, detailsPages: [] };

	// If caller passed an object created earlier with status/payload
	const status = (err && (err.status || (err.response && err.response.status))) || null;
	// prefer explicit payload shapes, fall back to entire err for inspection
	let payload = null;
	if (err && err.payload) payload = err.payload;
	else if (err && err.response && err.response.body) payload = err.response.body;
	else payload = null;

	let map = null;
	if (status === 400 || status === '400') map = MAPPINGS[400];
	else if (status === 401 || status === '401') map = MAPPINGS[401];
	else if (status === 403 || status === '403') map = MAPPINGS[403];
	else if (status === 404 || status === '404') map = MAPPINGS[404];
	else if (status === 500 || status === '500') map = MAPPINGS[500];
	else if (status === 502 || status === '502') map = MAPPINGS[502];
	else map = null;

	// Try to extract a usable message and code
	const rawMessage =
		(err && err.message) || (payload && (payload.error || payload.message)) || String(err);

	const title = (map && map.title) || DEFAULT.title;
	const message = (map && map.message) || rawMessage || DEFAULT.message;
	const code = err.code || (payload && payload.code) || status || DEFAULT.code;
	const steps = (map && map.steps) || [];

	const detailsParts = [];
	if (status) detailsParts.push(`HTTP status: ${status}`);
	if (err.url) detailsParts.push(`Request URL: ${err.url}`);
	if (payload && typeof payload === 'object') {
		detailsParts.push('Response payload:\n' + safeStringify(payload));
	} else if (payload) {
		detailsParts.push('Response payload:\n' + String(payload));
	}
	if (err.stack) detailsParts.push('Stack trace:\n' + err.stack);
	if (!detailsParts.length && rawMessage) detailsParts.push('Raw error:\n' + rawMessage);

	const detailsText = detailsParts.join('\n\n');
	const detailsPages = splitIntoPages(detailsText, 1200);

	return {
		code,
		title,
		message,
		steps,
		detailsPages,
		raw: err
	};
}

export default { translateError };

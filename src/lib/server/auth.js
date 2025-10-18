import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { redirect, error as kitError } from '@sveltejs/kit';
import { verify as argonVerify, hash as argonHash } from '@node-rs/argon2';

// Simple file-based auth (no database required)
export const sessionCookieName = 'sid';
const SESSION_DAYS = 7;
const DATA_DIR = '.auth-data';
const USERS_FILE = join(DATA_DIR, 'users.json');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
	mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON files safely
/** @param {string} path @param {any} defaultValue */
function readJsonFile(path, defaultValue = {}) {
	try {
		if (!existsSync(path)) return defaultValue;
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		return defaultValue;
	}
}

// Helper to write JSON files
/** @param {string} path @param {any} data */
function writeJsonFile(path, data) {
	writeFileSync(path, JSON.stringify(data, null, 2));
}

/** Hash a password using argon2id */
/** @param {string} password */
export async function hashPassword(password) {
	return argonHash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

/** Verify an argon2id hash */
/** @param {string} hash @param {string} password */
export async function verifyPassword(hash, password) {
	return argonVerify(hash, password);
}

/** Create a new session and return cookie value */
/** @param {number} userId */
export async function createSession(userId) {
	const id = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
	
	const sessions = readJsonFile(SESSIONS_FILE, {});
	sessions[id] = { id, userId, expiresAt: expiresAt.toISOString() };
	writeJsonFile(SESSIONS_FILE, sessions);
	
	return { id, expiresAt };
}

/** Validate session cookie value -> user */
/** @param {string} sessionId */
export async function validateSession(sessionId) {
	if (!sessionId) return { user: null, session: null };
	
	const sessions = readJsonFile(SESSIONS_FILE, {});
	const session = sessions[sessionId];
	if (!session) return { user: null, session: null };
	
	if (Date.now() >= new Date(session.expiresAt).getTime()) {
		delete sessions[sessionId];
		writeJsonFile(SESSIONS_FILE, sessions);
		return { user: null, session: null };
	}
	
	const users = readJsonFile(USERS_FILE, {});
	const user = users[session.userId];
	if (!user) return { user: null, session: null };
	
	return { 
		user: { id: user.id, email: user.email, name: user.name }, 
		session: { id: session.id, expiresAt: new Date(session.expiresAt) }
	};
}

/** Invalidate a session */
/** @param {string} sessionId */
export async function invalidateSession(sessionId) {
	const sessions = readJsonFile(SESSIONS_FILE, {});
	delete sessions[sessionId];
	writeJsonFile(SESSIONS_FILE, sessions);
}

/** Set cookie */
/** @param {import('@sveltejs/kit').RequestEvent} event @param {{ id: string, expiresAt: Date }} session */
export function setSessionCookie(event, session) {
	event.cookies.set(sessionCookieName, session.id, {
		httpOnly: true,
		sameSite: 'strict',
		path: '/',
		expires: session.expiresAt,
		secure: event.url.protocol === 'https:'
	});
}

/** Delete cookie */
/** @param {import('@sveltejs/kit').RequestEvent} event */
export function clearSessionCookie(event) {
	event.cookies.delete(sessionCookieName, { path: '/' });
}

/** Require user server-side. If not logged in, redirect to /login for pages or return 401 for endpoints */
/** @param {import('@sveltejs/kit').RequestEvent} event @param {{ redirectTo?: string }} opts */
export async function requireUser(event, opts = { redirectTo: '/login' }) {
	const sid = event.cookies.get(sessionCookieName) || '';
	const { user } = await validateSession(sid);
	if (!user) {
		if (event.route && String(event.route.id || '').endsWith('+page.server')) {
			throw redirect(302, opts?.redirectTo || '/login');
		}
		throw kitError(401, 'Unauthorized');
	}
	return user;
}

/** Look up user by email */
/** @param {string} email */
export async function findUserByEmail(email) {
	const users = readJsonFile(USERS_FILE, {});
	return Object.values(users).find(user => user.email === email) || null;
}

/** Create user */
/** @param {{ email: string, name: string, password: string }} input */
export async function createUser({ email, name, password }) {
	const users = readJsonFile(USERS_FILE, {});
	const id = Date.now(); // Simple ID generation
	const passwordHash = await hashPassword(password);
	
	users[id] = {
		id,
		email,
		name,
		passwordHash,
		createdAt: new Date().toISOString()
	};
	
	writeJsonFile(USERS_FILE, users);
	return { id, email, name };
}

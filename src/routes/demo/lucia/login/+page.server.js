import { hash, verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { supabase } from '$lib/server/db';

export const load = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/demo/lucia');
	}
	return {};
};

export const actions = {
	login: async (event) => {
		// Check if database is available
		if (!supabase) {
			return fail(503, {
				message: 'Database not available - this is a demo feature that requires database setup.'
			});
		}

		const formData = await event.request.formData();
		const username = String(formData.get('username') ?? '');
		const password = String(formData.get('password') ?? '');

		if (!validateUsername(username)) {
			return fail(400, {
				message: 'Invalid username (min 3, max 31 characters, alphanumeric only)'
			});
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password (min 6, max 255 characters)' });
		}

		const { data: results, error: selectError } = await supabase
			.from('users')
			.select('id, email, password_hash')
			.eq('email', username);

		if (selectError) {
			console.error('Failed to query users table:', selectError);
			return fail(500, { message: 'An error has occurred' });
		}

		const existingUser = results?.at(0) ?? null;
		if (!existingUser) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const validPassword = await verify(existingUser.password_hash, String(password), {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const session = await auth.createSession(existingUser.id);
		auth.setSessionCookie(event, session);

		return redirect(302, '/demo/lucia');
	},
	register: async (event) => {
		// Check if database is available
		if (!supabase) {
			return fail(503, {
				message: 'Database not available - this is a demo feature that requires database setup.'
			});
		}

		const formData = await event.request.formData();
		const username = String(formData.get('username') ?? '');
		const password = String(formData.get('password') ?? '');

		if (!validateUsername(username)) {
			return fail(400, { message: 'Invalid username' });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' });
		}

		const passwordHash = await hash(String(password), {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			const { error: insertError } = await supabase
				.from('users')
				.insert({ email: String(username), name: 'Demo', password_hash: passwordHash });
			if (insertError && !isDuplicateKeyError(insertError)) {
				throw insertError;
			}

			const {
				data: created,
				error: fetchError,
				status: fetchStatus
			} = await supabase.from('users').select('id').eq('email', String(username)).maybeSingle();

			if (fetchError && fetchStatus !== 406) {
				throw fetchError;
			}

			if (!created?.id) {
				throw new Error('Failed to create user');
			}

			const session = await auth.createSession(created.id);
			auth.setSessionCookie(event, session);
		} catch (err) {
			console.error('User registration failed:', err);
			return fail(500, { message: 'An error has occurred' });
		}
		return redirect(302, '/demo/lucia');
	}
};

/** @param {string} username */
function validateUsername(username) {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-z0-9_-]+$/.test(username)
	);
}

/** @param {string} password */
function validatePassword(password) {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}

/**
 * @param {unknown} error
 */
function isDuplicateKeyError(error) {
	return Boolean(error && typeof error === 'object' && 'code' in error && error.code === '23505');
}

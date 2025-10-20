import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

// Make database optional for deployment environments where it's not configured
/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let supabase = null;

if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
	try {
		supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
			auth: { persistSession: false },
			global: {
				headers: {
					'X-Client-Info': 'portwarden-ai-server'
				}
			}
		});
		console.log('Supabase client initialised');
	} catch (error) {
		console.warn(
			'Supabase client initialisation failed:',
			error instanceof Error ? error.message : String(error)
		);
		supabase = null;
	}
} else {
	console.warn(
		'SUPABASE_URL or SUPABASE_ANON_KEY is not set - database functionality will be unavailable'
	);
}

export { supabase };

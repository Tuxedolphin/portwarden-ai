import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Make database optional for deployment environments where it's not configured
/** @type {any} */
let db = null;

if (env.DATABASE_URL) {
	try {
		const client = mysql.createPool(env.DATABASE_URL);
		db = drizzle(client, { schema, mode: 'default' });
		console.log('Database connection established');
	} catch (error) {
		console.warn(
			'Database connection failed:',
			error instanceof Error ? error.message : String(error)
		);
		db = null;
	}
} else {
	console.warn('DATABASE_URL is not set - database functionality will be unavailable');
}

export { db };

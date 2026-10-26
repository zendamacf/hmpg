import { drizzle } from 'drizzle-orm/postgres-js';
import { DATABASE_URL } from '$app/env/private';
import * as schema from './schema';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const db = drizzle(DATABASE_URL, { schema });

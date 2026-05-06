import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db/client';
import * as schema from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications
		}
	}),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.PUBLIC_APP_URL,
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5
		}
	},
	advanced: {
		useSecureCookies: env.NODE_ENV === 'production'
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 10,
		storage: 'database'
	},
	trustedOrigins: [env.PUBLIC_APP_URL]
});

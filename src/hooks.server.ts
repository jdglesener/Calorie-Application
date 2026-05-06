import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: https:",
			"connect-src 'self'",
			"frame-ancestors 'none'"
		].join('; ')
	);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};

const corsHandler: Handle = async ({ event, resolve }) => {
	const origin = env.PUBLIC_APP_URL;

	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Allow-Credentials': 'true'
			}
		});
	}

	const response = await resolve(event);
	response.headers.set('Access-Control-Allow-Origin', origin);
	response.headers.set('Access-Control-Allow-Credentials', 'true');
	return response;
};

const authHandler: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;
	return resolve(event);
};

export const handle = sequence(securityHeaders, corsHandler, authHandler);

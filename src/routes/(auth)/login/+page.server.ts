import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/dashboard');
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.' });
		}

		try {
			const response = await auth.api.signInEmail({
				body: { email, password },
				asResponse: true
			});
			if (!response.ok) {
				return fail(401, { error: 'Invalid email or password.' });
			}
		} catch {
			return fail(401, { error: 'Invalid email or password.' });
		}

		throw redirect(302, '/dashboard');
	}
};

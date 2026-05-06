import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/dashboard');
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!name || !email || !password) {
			return fail(400, { error: 'All fields are required.' });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}

		try {
			const response = await auth.api.signUpEmail({
				body: { name, email, password },
				asResponse: true
			});
			if (!response.ok) {
				const body = await response.json().catch(() => ({}));
				return fail(400, { error: (body as { message?: string }).message ?? 'Registration failed.' });
			}
		} catch {
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}

		throw redirect(302, '/dashboard');
	}
};

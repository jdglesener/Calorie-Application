import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');
	return {
		friendId: params.id,
		today: new Date().toLocaleDateString('en-CA')
	};
};

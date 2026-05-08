import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = new Date().toLocaleDateString('en-CA');
	redirect(302, `/calories/${today}`);
};

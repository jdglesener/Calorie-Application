import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async ({ params }) => {
	if (!DATE_REGEX.test(params.date)) {
		throw error(400, 'Invalid date format — expected YYYY-MM-DD');
	}
	return { date: params.date };
};

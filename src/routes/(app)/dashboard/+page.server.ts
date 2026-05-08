import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
	return { today };
};

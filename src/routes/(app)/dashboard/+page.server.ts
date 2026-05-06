import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = new Date().toISOString().slice(0, 10);
	return { today };
};

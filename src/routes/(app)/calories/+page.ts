import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// ssr=false ensures this runs in the browser so new Date() uses the user's local timezone
export const ssr = false;

export const load: PageLoad = async () => {
	const today = new Date().toLocaleDateString('en-CA');
	redirect(302, `/calories/${today}`);
};

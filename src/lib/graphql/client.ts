import { createClient, cacheExchange, fetchExchange } from '@urql/svelte';

export function createUrqlClient() {
	return createClient({
		url: '/api/graphql',
		exchanges: [cacheExchange, fetchExchange],
		fetchOptions: () => ({
			credentials: 'include'
		})
	});
}

import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '$lib/server/graphql/context';

export function requireAuth(context: GraphQLContext) {
	if (!context.user) {
		throw new GraphQLError('Authentication required', {
			extensions: { code: 'UNAUTHENTICATED' }
		});
	}
	return context.user;
}

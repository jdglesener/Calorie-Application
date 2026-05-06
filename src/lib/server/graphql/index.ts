import { createYoga } from 'graphql-yoga';
import { schema } from './schema';
import { createContext } from './context';
import { env } from '$env/dynamic/private';

export const yoga = createYoga({
	schema,
	context: (executionContext) => {
		const locals = (executionContext as { locals: App.Locals }).locals;
		return createContext(locals);
	},
	graphqlEndpoint: '/api/graphql',
	fetchAPI: { Response, Request },
	cors: false,
	maskedErrors: env.NODE_ENV === 'production',
	logging: env.NODE_ENV !== 'production'
});

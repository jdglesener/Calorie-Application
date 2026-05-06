import { makeExecutableSchema } from '@graphql-tools/schema';
import { scalarTypeDefs, scalarResolvers } from './scalars';
import { authTypeDefs } from './auth/typedefs';
import { authResolvers } from './auth/resolvers';
import { foodTypeDefs } from './food/typedefs';
import { foodResolvers } from './food/resolvers';
import { logsTypeDefs } from './logs/typedefs';
import { logsResolvers } from './logs/resolvers';
import { socialTypeDefs } from './social/typedefs';
import { socialResolvers } from './social/resolvers';
import { challengesTypeDefs } from './challenges/typedefs';
import { challengesResolvers } from './challenges/resolvers';
import { mergeResolvers } from '@graphql-tools/merge';

const rootTypeDefs = `#graphql
	type Query
	type Mutation
`;

export const schema = makeExecutableSchema({
	typeDefs: [
		rootTypeDefs,
		scalarTypeDefs,
		authTypeDefs,
		foodTypeDefs,
		logsTypeDefs,
		socialTypeDefs,
		challengesTypeDefs
	],
	resolvers: mergeResolvers([
		scalarResolvers,
		authResolvers,
		foodResolvers,
		logsResolvers,
		socialResolvers,
		challengesResolvers
	])
});

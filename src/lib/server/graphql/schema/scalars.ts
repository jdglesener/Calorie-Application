import { GraphQLScalarType, Kind } from 'graphql';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const DateScalar = new GraphQLScalarType({
	name: 'Date',
	description: 'ISO 8601 date string (YYYY-MM-DD)',
	serialize(value) {
		if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
			throw new Error(`Date scalar: invalid value "${value}"`);
		}
		return value;
	},
	parseValue(value) {
		if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
			throw new Error(`Date scalar: invalid input "${value}"`);
		}
		return value;
	},
	parseLiteral(ast) {
		if (ast.kind !== Kind.STRING || !DATE_REGEX.test(ast.value)) {
			throw new Error('Date scalar: expected a YYYY-MM-DD string');
		}
		return ast.value;
	}
});

export const DateTimeScalar = new GraphQLScalarType({
	name: 'DateTime',
	description: 'ISO 8601 datetime string',
	serialize(value) {
		if (value instanceof Date) return value.toISOString();
		if (typeof value === 'string') return value;
		throw new Error('DateTime scalar: expected Date or ISO string');
	},
	parseValue(value) {
		if (typeof value === 'string') return value;
		throw new Error('DateTime scalar: expected ISO string');
	},
	parseLiteral(ast) {
		if (ast.kind !== Kind.STRING) throw new Error('DateTime scalar: expected string literal');
		return ast.value;
	}
});

export const scalarTypeDefs = `#graphql
	scalar Date
	scalar DateTime
`;

export const scalarResolvers = {
	Date: DateScalar,
	DateTime: DateTimeScalar
};

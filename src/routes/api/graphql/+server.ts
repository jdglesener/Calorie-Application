import { yoga } from '$lib/server/graphql';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	return yoga.fetch(event.request, { locals: event.locals } as Parameters<typeof yoga.fetch>[1]);
};

export const POST: RequestHandler = async (event) => {
	return yoga.fetch(event.request, { locals: event.locals } as Parameters<typeof yoga.fetch>[1]);
};

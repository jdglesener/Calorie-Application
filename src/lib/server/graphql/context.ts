import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '$lib/server/db/schema';
import { db, type DB } from '$lib/server/db/client';

export type GraphQLContext = {
	db: DB;
	user: InferSelectModel<typeof users> | null;
	sessionId: string | null;
	signal: AbortSignal;
};

export function createContext(locals: App.Locals, request: Request): GraphQLContext {
	return {
		db,
		user: locals.user as InferSelectModel<typeof users> | null,
		sessionId: locals.session?.id ?? null,
		signal: request.signal
	};
}

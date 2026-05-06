import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '$lib/server/db/schema';
import { db, type DB } from '$lib/server/db/client';

export type GraphQLContext = {
	db: DB;
	user: InferSelectModel<typeof users> | null;
	sessionId: string | null;
};

export function createContext(locals: App.Locals): GraphQLContext {
	return {
		db,
		user: locals.user as InferSelectModel<typeof users> | null,
		sessionId: locals.session?.id ?? null
	};
}

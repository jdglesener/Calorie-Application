import { eq, ilike, and, ne } from 'drizzle-orm';
import { users, userProfiles } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/middleware';
import type { GraphQLContext } from '$lib/server/graphql/context';

export const authResolvers = {
	Query: {
		me: (_: unknown, __: unknown, ctx: GraphQLContext) => {
			return ctx.user ?? null;
		},
		searchUsers: async (
			_: unknown,
			{ query, limit = 10 }: { query: string; limit?: number },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const cap = Math.min(limit, 20);
			return ctx.db
				.select({
					id: users.id,
					name: users.name,
					displayName: userProfiles.displayName,
					avatarUrl: userProfiles.avatarUrl
				})
				.from(users)
				.leftJoin(userProfiles, eq(users.id, userProfiles.userId))
				.where(and(ilike(users.name, `%${query}%`), ne(users.id, user.id)))
				.limit(cap);
		}
	},

	Mutation: {
		updateProfile: async (
			_: unknown,
			{ input }: { input: Record<string, unknown> },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);

			const mapped = {
				displayName: input.displayName as string | undefined,
				heightCm: input.heightCm != null ? String(input.heightCm) : undefined,
				weightKg: input.weightKg != null ? String(input.weightKg) : undefined,
				dateOfBirth: input.dateOfBirth as string | undefined,
				activityLevel:
					(input.activityLevel as string | undefined)?.toLowerCase() as
						| 'sedentary'
						| 'lightly_active'
						| 'moderately_active'
						| 'very_active'
						| 'extra_active'
						| undefined,
				goalType: (input.goalType as string | undefined)?.toLowerCase() as
					| 'lose'
					| 'maintain'
					| 'gain'
					| undefined,
				dailyCalorieGoal: input.dailyCalorieGoal as number | undefined,
				updatedAt: new Date()
			};

			const [profile] = await ctx.db
				.insert(userProfiles)
				.values({ userId: user.id, ...mapped })
				.onConflictDoUpdate({
					target: userProfiles.userId,
					set: mapped
				})
				.returning();

			return profile;
		}
	},

	User: {
		profile: (parent: { id: string }, _: unknown, ctx: GraphQLContext) =>
			ctx.db.query.userProfiles.findFirst({
				where: eq(userProfiles.userId, parent.id)
			})
	}
};

import { eq, and, between, desc, sql, lte, gte } from 'drizzle-orm';
import {
	dailyLogs,
	foodEntries,
	foodItems,
	challenges,
	challengeParticipants,
	challengeEntries
} from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/middleware';
import {
	upsertDailyLogSchema,
	addFoodEntrySchema,
	updateFoodEntrySchema
} from '$lib/server/graphql/validators/logs';
import type { GraphQLContext } from '$lib/server/graphql/context';
import { GraphQLError } from 'graphql';

async function upsertChallengeEntries(
	ctx: GraphQLContext,
	userId: string,
	logDate: string
): Promise<void> {
	const [logRow] = await ctx.db
		.select({ id: dailyLogs.id })
		.from(dailyLogs)
		.where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.logDate, logDate)))
		.limit(1);

	if (!logRow) return;

	const [sumRow] = await ctx.db
		.select({ total: sql<number>`coalesce(sum(${foodEntries.calories}), 0)` })
		.from(foodEntries)
		.where(eq(foodEntries.dailyLogId, logRow.id));

	const totalCalories = Math.round(Number(sumRow?.total ?? 0));

	const activeChallenges = await ctx.db
		.select({ id: challenges.id })
		.from(challenges)
		.innerJoin(
			challengeParticipants,
			and(
				eq(challengeParticipants.challengeId, challenges.id),
				eq(challengeParticipants.userId, userId),
				eq(challengeParticipants.status, 'accepted')
			)
		)
		.where(
			and(
				eq(challenges.status, 'active'),
				lte(challenges.startDate, logDate),
				gte(challenges.endDate, logDate),
				sql`${challenges.challengeType} IN ('calorie_limit', 'calorie_goal')`
			)
		);

	if (activeChallenges.length === 0) return;

	await ctx.db
		.insert(challengeEntries)
		.values(
			activeChallenges.map((c) => ({
				challengeId: c.id,
				userId,
				entryDate: logDate,
				metricValue: totalCalories
			}))
		)
		.onConflictDoUpdate({
			target: [challengeEntries.challengeId, challengeEntries.userId, challengeEntries.entryDate],
			set: { metricValue: totalCalories, updatedAt: new Date() }
		});
}

export const logsResolvers = {
	Query: {
		dailyLog: async (_: unknown, { date }: { date: string }, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);
			const [log] = await ctx.db
				.select()
				.from(dailyLogs)
				.where(and(eq(dailyLogs.userId, user.id), eq(dailyLogs.logDate, date)))
				.limit(1);
			return log ?? null;
		},

		dailyLogs: async (
			_: unknown,
			{ startDate, endDate }: { startDate: string; endDate: string },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			return ctx.db
				.select()
				.from(dailyLogs)
				.where(
					and(
						eq(dailyLogs.userId, user.id),
						between(dailyLogs.logDate, startDate, endDate)
					)
				)
				.orderBy(desc(dailyLogs.logDate));
		},

		calorieStreak: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);
			const rows = await ctx.db
				.select({ logDate: dailyLogs.logDate })
				.from(dailyLogs)
				.where(eq(dailyLogs.userId, user.id))
				.orderBy(desc(dailyLogs.logDate))
				.limit(365);

			let streak = 0;
			const today = new Date();
			for (let i = 0; i < rows.length; i++) {
				const expected = new Date(today);
				expected.setDate(today.getDate() - i);
				const expectedStr = expected.toLocaleDateString('en-CA');
				if (rows[i].logDate !== expectedStr) break;
				streak++;
			}
			return streak;
		}
	},

	Mutation: {
		upsertDailyLog: async (
			_: unknown,
			{ input }: { input: unknown },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const validated = upsertDailyLogSchema.parse(input);

			const [log] = await ctx.db
				.insert(dailyLogs)
				.values({ userId: user.id, logDate: validated.date, ...validated })
				.onConflictDoUpdate({
					target: [dailyLogs.userId, dailyLogs.logDate],
					set: {
						calorieGoal: validated.calorieGoal,
						notes: validated.notes,
						updatedAt: new Date()
					}
				})
				.returning();

			return log;
		},

		addFoodEntry: async (
			_: unknown,
			{ input }: { input: unknown },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const validated = addFoodEntrySchema.parse(input);

			const [log] = await ctx.db
				.insert(dailyLogs)
				.values({ userId: user.id, logDate: validated.date })
				.onConflictDoUpdate({
					target: [dailyLogs.userId, dailyLogs.logDate],
					set: { updatedAt: new Date() }
				})
				.returning();

			const [entry] = await ctx.db
				.insert(foodEntries)
				.values({
					dailyLogId: log.id,
					foodItemId: validated.foodItemId,
					foodName: validated.foodName,
					servingSize: String(validated.servingSize),
					servingUnit: validated.servingUnit,
					servingsConsumed: String(validated.servingsConsumed),
					calories: validated.calories,
					proteinG: validated.proteinG != null ? String(validated.proteinG) : undefined,
					carbsG: validated.carbsG != null ? String(validated.carbsG) : undefined,
					fatG: validated.fatG != null ? String(validated.fatG) : undefined,
					mealType: validated.mealType ?? 'other'
				})
				.returning();

			await upsertChallengeEntries(ctx, user.id, validated.date);
			return entry;
		},

		updateFoodEntry: async (
			_: unknown,
			{ id, input }: { id: string; input: unknown },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const validated = updateFoodEntrySchema.parse(input);

			const [existing] = await ctx.db
				.select({ id: foodEntries.id, logDate: dailyLogs.logDate })
				.from(foodEntries)
				.innerJoin(dailyLogs, eq(foodEntries.dailyLogId, dailyLogs.id))
				.where(and(eq(foodEntries.id, id), eq(dailyLogs.userId, user.id)))
				.limit(1);

			if (!existing) {
				throw new GraphQLError('Entry not found', { extensions: { code: 'NOT_FOUND' } });
			}

			const [updated] = await ctx.db
				.update(foodEntries)
				.set({
					servingsConsumed:
						validated.servingsConsumed != null ? String(validated.servingsConsumed) : undefined,
					calories: validated.calories,
					proteinG: validated.proteinG != null ? String(validated.proteinG) : undefined,
					carbsG: validated.carbsG != null ? String(validated.carbsG) : undefined,
					fatG: validated.fatG != null ? String(validated.fatG) : undefined,
					mealType: validated.mealType
				})
				.where(eq(foodEntries.id, id))
				.returning();

			await upsertChallengeEntries(ctx, user.id, existing.logDate);
			return updated;
		},

		deleteFoodEntry: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);

			const [entry] = await ctx.db
				.select({ id: foodEntries.id, logDate: dailyLogs.logDate })
				.from(foodEntries)
				.innerJoin(dailyLogs, eq(foodEntries.dailyLogId, dailyLogs.id))
				.where(and(eq(foodEntries.id, id), eq(dailyLogs.userId, user.id)))
				.limit(1);

			if (!entry) {
				throw new GraphQLError('Entry not found', { extensions: { code: 'NOT_FOUND' } });
			}

			await ctx.db.delete(foodEntries).where(eq(foodEntries.id, id));
			await upsertChallengeEntries(ctx, user.id, entry.logDate);
			return true;
		}
	},

	DailyLog: {
		entries: (parent: { id: string }, _: unknown, ctx: GraphQLContext) =>
			ctx.db
				.select()
				.from(foodEntries)
				.where(eq(foodEntries.dailyLogId, parent.id))
				.orderBy(foodEntries.loggedAt),

		totalCalories: async (parent: { id: string }, _: unknown, ctx: GraphQLContext) => {
			const [result] = await ctx.db
				.select({ total: sql<number>`coalesce(sum(${foodEntries.calories}), 0)` })
				.from(foodEntries)
				.where(eq(foodEntries.dailyLogId, parent.id));
			return result?.total ?? 0;
		},

		totalProteinG: async (parent: { id: string }, _: unknown, ctx: GraphQLContext) => {
			const [result] = await ctx.db
				.select({ total: sql<number>`coalesce(sum(${foodEntries.proteinG}::numeric), 0)` })
				.from(foodEntries)
				.where(eq(foodEntries.dailyLogId, parent.id));
			return Number(result?.total ?? 0);
		},

		totalCarbsG: async (parent: { id: string }, _: unknown, ctx: GraphQLContext) => {
			const [result] = await ctx.db
				.select({ total: sql<number>`coalesce(sum(${foodEntries.carbsG}::numeric), 0)` })
				.from(foodEntries)
				.where(eq(foodEntries.dailyLogId, parent.id));
			return Number(result?.total ?? 0);
		},

		totalFatG: async (parent: { id: string }, _: unknown, ctx: GraphQLContext) => {
			const [result] = await ctx.db
				.select({ total: sql<number>`coalesce(sum(${foodEntries.fatG}::numeric), 0)` })
				.from(foodEntries)
				.where(eq(foodEntries.dailyLogId, parent.id));
			return Number(result?.total ?? 0);
		}
	},

	FoodEntry: {
		foodItem: (parent: { foodItemId: string | null }, _: unknown, ctx: GraphQLContext) => {
			if (!parent.foodItemId) return null;
			return ctx.db.query.foodItems.findFirst({
				where: eq(foodItems.id, parent.foodItemId)
			});
		},
		mealType: (parent: { mealType: string | null }) =>
			(parent.mealType ?? 'other').toUpperCase()
	}
};

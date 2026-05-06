import { eq, ilike, or, isNull } from 'drizzle-orm';
import { foodItems } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/middleware';
import { createFoodItemSchema } from '$lib/server/graphql/validators/food';
import type { GraphQLContext } from '$lib/server/graphql/context';
import { GraphQLError } from 'graphql';

export const foodResolvers = {
	Query: {
		searchFoods: async (
			_: unknown,
			{ query, limit = 20 }: { query: string; limit?: number },
			ctx: GraphQLContext
		) => {
			requireAuth(ctx);
			const cap = Math.min(limit, 50);
			return ctx.db
				.select()
				.from(foodItems)
				.where(
					or(
						ilike(foodItems.name, `%${query}%`),
						ilike(foodItems.brand, `%${query}%`),
						isNull(foodItems.createdBy)
					)
				)
				.limit(cap);
		},

		foodItem: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
			requireAuth(ctx);
			const [item] = await ctx.db.select().from(foodItems).where(eq(foodItems.id, id)).limit(1);
			return item ?? null;
		}
	},

	Mutation: {
		createFoodItem: async (
			_: unknown,
			{ input }: { input: unknown },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const validated = createFoodItemSchema.parse(input);

			const [item] = await ctx.db
				.insert(foodItems)
				.values({
					...validated,
					servingSize: String(validated.servingSize),
					proteinG: validated.proteinG != null ? String(validated.proteinG) : undefined,
					carbsG: validated.carbsG != null ? String(validated.carbsG) : undefined,
					fatG: validated.fatG != null ? String(validated.fatG) : undefined,
					fiberG: validated.fiberG != null ? String(validated.fiberG) : undefined,
					sodiumMg: validated.sodiumMg != null ? String(validated.sodiumMg) : undefined,
					createdBy: user.id
				})
				.returning();

			if (!item) throw new GraphQLError('Failed to create food item');
			return item;
		}
	}
};

import { eq, and, ilike, or, isNull, inArray } from 'drizzle-orm';
import { foodItems } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/middleware';
import { createFoodItemSchema, lookupBarcodeSchema } from '$lib/server/graphql/validators/food';
import type { GraphQLContext } from '$lib/server/graphql/context';
import { GraphQLError } from 'graphql';

export const foodResolvers = {
	Query: {
		searchFoods: async (
			_: unknown,
			{ query, limit = 20 }: { query: string; limit?: number },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const cap = Math.min(limit, 50);
			return ctx.db
				.select()
				.from(foodItems)
				.where(
					and(
						or(ilike(foodItems.name, `%${query}%`), ilike(foodItems.brand, `%${query}%`)),
						or(isNull(foodItems.createdBy), eq(foodItems.createdBy, user.id))
					)
				)
				.limit(cap);
		},

		searchFoodsExternal: async (
			_: unknown,
			{ query }: { query: string },
			ctx: GraphQLContext
		) => {
			requireAuth(ctx);

			let json: Record<string, unknown>;
			try {
				const params = new URLSearchParams({
					search_terms: query,
					json: '1',
					page_size: '15',
					fields: 'code,product_name,product_name_en,brands,serving_size,nutriments'
				});
				const res = await fetch(
					`https://world.openfoodfacts.org/api/v2/search?${params}`,
					{ headers: { 'User-Agent': 'DisciplineApp/1.0 (personal calorie tracker)' } }
				);
				if (!res.ok) return [];
				json = await res.json() as Record<string, unknown>;
			} catch {
				return [];
			}

			const products = (json.products as Record<string, unknown>[]) ?? [];

			function parseServing(str?: string): [number, string] {
				if (!str) return [100, 'g'];
				const m = String(str).match(/^([\d.]+)\s*([a-zA-Z]+)/);
				return m ? [parseFloat(m[1]) || 1, m[2].toLowerCase()] : [100, 'g'];
			}

			const toInsert = products
				.map((p) => {
					const n = (p.nutriments ?? {}) as Record<string, number>;
					const hasServing = n['energy-kcal_serving'] != null;
					const kcal = hasServing ? (n['energy-kcal_serving'] ?? 0) : (n['energy-kcal_100g'] ?? 0);
					const protein = hasServing ? n['proteins_serving'] : n['proteins_100g'];
					const carbs = hasServing ? n['carbohydrates_serving'] : n['carbohydrates_100g'];
					const fat = hasServing ? n['fat_serving'] : n['fat_100g'];
					const [servingSize, servingUnit] = parseServing(
						hasServing ? (p.serving_size as string) : '100g'
					);
					const name = ((p.product_name_en ?? p.product_name ?? '') as string).trim();
					const code = (p.code as string | undefined)?.trim();
					if (!name || !code) return null;
					return {
						name,
						brand: ((p.brands ?? '') as string).trim() || null,
						servingSize: String(servingSize),
						servingUnit,
						caloriesPerServing: Math.round(kcal),
						proteinG: protein != null ? String(Math.round(protein * 10) / 10) : undefined,
						carbsG: carbs != null ? String(Math.round(carbs * 10) / 10) : undefined,
						fatG: fat != null ? String(Math.round(fat * 10) / 10) : undefined,
						externalId: code,
						isVerified: false,
						createdBy: null
					};
				})
				.filter((x): x is NonNullable<typeof x> => x !== null);

			if (toInsert.length === 0) return [];

			await ctx.db
				.insert(foodItems)
				.values(toInsert)
				.onConflictDoNothing({ target: foodItems.externalId });

			const externalIds = toInsert.map((x) => x.externalId);
			return ctx.db
				.select()
				.from(foodItems)
				.where(inArray(foodItems.externalId, externalIds));
		},

		foodItem: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
			requireAuth(ctx);
			const [item] = await ctx.db.select().from(foodItems).where(eq(foodItems.id, id)).limit(1);
			return item ?? null;
		},

		lookupBarcode: async (_: unknown, { barcode }: { barcode: string }, ctx: GraphQLContext) => {
			requireAuth(ctx);
			const { barcode: validBarcode } = lookupBarcodeSchema.parse({ barcode });

			// Cache hit — already in DB
			const [cached] = await ctx.db
				.select()
				.from(foodItems)
				.where(eq(foodItems.externalId, validBarcode))
				.limit(1);
			if (cached) return cached;

			// Fetch from Open Food Facts (server-side only, no API key required)
			let json: Record<string, unknown>;
			try {
				const res = await fetch(
					`https://world.openfoodfacts.org/api/v0/product/${validBarcode}.json`,
					{ headers: { 'User-Agent': 'DisciplineApp/1.0 (personal calorie tracker)' } }
				);
				if (!res.ok) return null;
				json = await res.json() as Record<string, unknown>;
			} catch {
				return null;
			}

			if ((json.status as number) !== 1 || !json.product) return null;

			const p = json.product as Record<string, unknown>;
			const n = (p.nutriments ?? {}) as Record<string, number>;

			function parseServing(str?: string): [number, string] {
				if (!str) return [100, 'g'];
				const m = String(str).match(/^([\d.]+)\s*([a-zA-Z]+)/);
				return m ? [parseFloat(m[1]) || 1, m[2].toLowerCase()] : [100, 'g'];
			}

			// Prefer per-serving values; fall back to per-100g
			const hasServing = n['energy-kcal_serving'] != null;
			const kcal = hasServing ? (n['energy-kcal_serving'] ?? 0) : (n['energy-kcal_100g'] ?? 0);
			const protein = hasServing ? n['proteins_serving'] : n['proteins_100g'];
			const carbs = hasServing ? n['carbohydrates_serving'] : n['carbohydrates_100g'];
			const fat = hasServing ? n['fat_serving'] : n['fat_100g'];
			const [servingSize, servingUnit] = parseServing(
				hasServing ? (p.serving_size as string) : '100g'
			);

			const name = ((p.product_name_en ?? p.product_name ?? '') as string).trim() || 'Unknown product';
			const brand = ((p.brands ?? '') as string).trim() || undefined;

			try {
				const [item] = await ctx.db
					.insert(foodItems)
					.values({
						name,
						brand: brand ?? null,
						servingSize: String(servingSize),
						servingUnit,
						caloriesPerServing: Math.round(kcal),
						proteinG: protein != null ? String(Math.round(protein * 10) / 10) : undefined,
						carbsG: carbs != null ? String(Math.round(carbs * 10) / 10) : undefined,
						fatG: fat != null ? String(Math.round(fat * 10) / 10) : undefined,
						externalId: validBarcode,
						isVerified: false,
						createdBy: null
					})
					.returning();
				return item ?? null;
			} catch {
				// Race condition — another request inserted first; re-query
				const [retry] = await ctx.db
					.select()
					.from(foodItems)
					.where(eq(foodItems.externalId, validBarcode))
					.limit(1);
				return retry ?? null;
			}
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
